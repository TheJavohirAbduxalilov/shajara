<?php
/**
 * GEDCOM Import API
 * POST /api/import/gedcom.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$auth = new Auth();
$auth->requireEditAccess();

$treeId = $auth->getTreeId();

// Get GEDCOM content from request
$gedcomContent = '';

if (isset($_FILES['file'])) {
    $gedcomContent = file_get_contents($_FILES['file']['tmp_name']);
} else {
    $data = getJsonInput();
    $gedcomContent = $data['content'] ?? '';
}

if (empty($gedcomContent)) {
    errorResponse('No GEDCOM content provided');
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();

    // Parse GEDCOM
    $individuals = [];
    $families = [];
    $currentRecord = null;
    $currentType = null;
    $currentEvent = null;

    $lines = explode("\n", $gedcomContent);

    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;

        // Parse line: level tag [value]
        if (!preg_match('/^(\d+)\s+(@\w+@)?\s*(\w+)(.*)$/', $line, $matches)) {
            continue;
        }

        $level = (int)$matches[1];
        $xref = trim($matches[2] ?? '');
        $tag = trim($matches[3]);
        $value = trim($matches[4] ?? '');

        if ($level === 0) {
            // Save previous record
            if ($currentRecord && $currentType) {
                if ($currentType === 'INDI') {
                    $individuals[$currentRecord['xref']] = $currentRecord;
                } elseif ($currentType === 'FAM') {
                    $families[$currentRecord['xref']] = $currentRecord;
                }
            }

            // Start new record
            if ($tag === 'INDI') {
                $currentType = 'INDI';
                $currentEvent = null;
                $currentRecord = [
                    'xref' => $xref,
                    'given_name' => '',
                    'surname' => '',
                    'gender' => null,
                    'birth_year' => null
                ];
            } elseif ($tag === 'FAM') {
                $currentType = 'FAM';
                $currentEvent = null;
                $currentRecord = [
                    'xref' => $xref,
                    'husband' => null,
                    'wife' => null,
                    'children' => []
                ];
            } else {
                $currentType = null;
                $currentRecord = null;
            }
        } elseif ($currentRecord) {
            // Process record data
            if ($currentType === 'INDI') {
                switch ($tag) {
                    case 'NAME':
                        $name = trim($value);
                        $given = '';
                        $surname = '';
                        if (strpos($name, '/') !== false) {
                            $parts = explode('/', $name);
                            $given = trim($parts[0]);
                            $surname = trim($parts[1] ?? '');
                        } else {
                            $parts = preg_split('/\s+/', $name);
                            $given = trim($parts[0] ?? '');
                            $surname = trim($parts[1] ?? '');
                        }
                        $currentRecord['given_name'] = $given;
                        $currentRecord['surname'] = $surname;
                        if ($level === 1) {
                            $currentEvent = null;
                        }
                        break;
                    case 'SEX':
                        $currentRecord['gender'] = strtolower($value) === 'm' ? 'male' : 'female';
                        if ($level === 1) {
                            $currentEvent = null;
                        }
                        break;
                    case 'BIRT':
                        $currentEvent = 'BIRT';
                        break;
                    case 'DEAT':
                        $currentEvent = 'DEAT';
                        break;
                    case 'DATE':
                        // Extract year from date
                        if ($currentEvent === 'BIRT' && preg_match('/(\d{4})/', $value, $yearMatch)) {
                            $year = (int)$yearMatch[1];
                            $currentRecord['birth_year'] = $currentRecord['birth_year'] ?? $year;
                        }
                        break;
                    default:
                        if ($level === 1) {
                            $currentEvent = null;
                        }
                        break;
                }
            } elseif ($currentType === 'FAM') {
                switch ($tag) {
                    case 'HUSB':
                        $currentRecord['husband'] = $value;
                        break;
                    case 'WIFE':
                        $currentRecord['wife'] = $value;
                        break;
                    case 'CHIL':
                        $currentRecord['children'][] = $value;
                        break;
                }
            }
        }
    }

    // Save last record
    if ($currentRecord && $currentType) {
        if ($currentType === 'INDI') {
            $individuals[$currentRecord['xref']] = $currentRecord;
        } elseif ($currentType === 'FAM') {
            $families[$currentRecord['xref']] = $currentRecord;
        }
    }

    if (empty($individuals)) {
        errorResponse('No individuals found in GEDCOM file');
    }

    // Clear ALL existing data for this tree (including root person)
    $stmt = $db->prepare("DELETE FROM marriages WHERE tree_id = ?");
    $stmt->execute([$treeId]);

    $stmt = $db->prepare("DELETE FROM persons WHERE tree_id = ?");
    $stmt->execute([$treeId]);

    // Find the root person from GEDCOM (first person in a family as husband/wife, or just first person)
    $rootXref = null;

    // Try to find someone who is a parent
    foreach ($families as $fam) {
        if (!empty($fam['husband']) && isset($individuals[$fam['husband']])) {
            $rootXref = $fam['husband'];
            break;
        }
        if (!empty($fam['wife']) && isset($individuals[$fam['wife']])) {
            $rootXref = $fam['wife'];
            break;
        }
    }

    // If no parent found, use first individual
    if (!$rootXref) {
        $rootXref = array_key_first($individuals);
    }

    // Create mapping from GEDCOM xref to database ID
    $xrefToId = [];

    // Insert individuals (root person first with is_root=1)
    $stmt = $db->prepare("
        INSERT INTO persons (tree_id, given_name, surname, gender, birth_year, is_root)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($individuals as $xref => $indi) {
        $isRoot = ($xref === $rootXref);
        $stmt->execute([
            $treeId,
            $indi['given_name'] ?: null,
            $indi['surname'] ?: null,
            $indi['gender'],
            $indi['birth_year'],
            $isRoot
        ]);
        $xrefToId[$xref] = $db->lastInsertId();
    }

    // Insert families (marriages)
    $marriageStmt = $db->prepare("
        INSERT INTO marriages (tree_id, husband_id, wife_id)
        VALUES (?, ?, ?)
    ");

    $childStmt = $db->prepare("
        INSERT INTO marriage_children (marriage_id, child_id)
        VALUES (?, ?)
    ");

    foreach ($families as $xref => $fam) {
        $husbandId = isset($fam['husband']) ? ($xrefToId[$fam['husband']] ?? null) : null;
        $wifeId = isset($fam['wife']) ? ($xrefToId[$fam['wife']] ?? null) : null;

        if ($husbandId && $wifeId) {
            $marriageStmt->execute([$treeId, $husbandId, $wifeId]);
            $marriageId = $db->lastInsertId();

            // Add children
            foreach ($fam['children'] as $childXref) {
                $childId = $xrefToId[$childXref] ?? null;
                if ($childId) {
                    $childStmt->execute([$marriageId, $childId]);
                }
            }
        }
    }

    // Update tree timestamp
    $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
    $stmt->execute([$treeId]);

    $db->commit();

    successResponse([
        'imported_persons' => count($individuals),
        'imported_families' => count($families)
    ], 'GEDCOM imported successfully');

} catch (Exception $e) {
    $db->rollBack();
    errorResponse('Import failed: ' . $e->getMessage(), 500);
}
