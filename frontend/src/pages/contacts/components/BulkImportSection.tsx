import React, { useState, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Text,
  Group,
  Button,
  Stack,
  Select,
  Badge,
  Table,
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  Modal,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconUpload,
  IconDownload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconTrash,
  IconUsers,
  IconInfoCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';
import { useContact } from '../../../context/ContactContext';
import { useCRM } from '../../../context/CRMContext';

export interface ParsedContactRow {
  rowNum: number;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  contactPerson: string;
  designation: string;
  category: string;
  location?: string;
  source: string;
  remarks: string;
  website?: string;
  isValid: boolean;
  errors: string[];
}

// Exported utility to download sample CSV template
export const downloadSampleCSV = () => {
  const csvContent =
    'ID,Company Name,Industry / Category,Location,Contact Person,Phone Number,Email,Designation,Website,Source\n' +
    '1,Apex Tech Solutions,,Chennai,Ramesh Kumar,9876543210,ramesh@apextech.com,Director,,Bulk Import\n' +
    '2,CloudSphere IT,,Bangalore,Priya,9123456780,priya@cloudsphere.in,Tech Lead,,Bulk Import\n' +
    '3,NexGen Logistics,,Coimbatore,Vignesh,9840123456,vignesh@nexgen.com,Operations Manager,,Bulk Import\n' +
    '4,Starlight Media,,Madurai,Anitha,9789012345,anitha@starlight.co,Marketing Head,,Bulk Import\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'crm_contacts_bulk_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface BulkImportSectionProps {
  opened: boolean;
  onClose: () => void;
  onImportComplete?: (newBatchId?: string) => void;
}

export const BulkImportSection: React.FC<BulkImportSectionProps> = ({
  opened,
  onClose,
  onImportComplete,
}) => {
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';
  const { metadata, bulkImportContacts } = useContact();
  const { currentUser } = useCRM();

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedContactRow[]>([]);
  const [importing, setImporting] = useState(false);

  // Configuration options for the batch
  const [defaultAssignedTo, setDefaultAssignedTo] = useState<string>('Unassigned');
  const [defaultCategory, setDefaultCategory] = useState<string>('Product');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = downloadSampleCSV;

  const handleModalClose = () => {
    handleClear();
    onClose();
  };

  // 2. Parse CSV helper
  const parseCSVContent = (text: string): ParsedContactRow[] => {
    // Strip BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Simple robust CSV split respecting quotes
    const splitCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const rawHeaders = splitCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Map common header variations
    const findExact = (keys: string[]) => rawHeaders.findIndex((h) => keys.includes(h));
    const findIncludes = (keys: string[]) => rawHeaders.findIndex((h) => keys.some((k) => h.includes(k)));
    const findCol = (exactKeys: string[], fallbackKeys: string[] = []) => {
      const ex = findExact(exactKeys);
      if (ex !== -1) return ex;
      return findIncludes(fallbackKeys.length > 0 ? fallbackKeys : exactKeys);
    };

    const idxId = findCol(['id', 'sno', 'slno']);
    const idxCompany = findCol(['companyname', 'company', 'organization', 'business'], ['company', 'org']);
    const idxContactPerson = findCol(['contactperson', 'representative', 'rep', 'person'], ['contactperson', 'person']);
    const idxName = findCol(['fullname', 'clientname', 'contactname', 'name'], ['fullname', 'clientname', 'contactname']);
    const idxPhone = findCol(
      ['phonenumber', 'phone', 'mobile', 'cell', 'contactnumber', 'tel', 'phonenumb'],
      ['phone', 'mobile', 'cell', 'numb']
    );
    const idxEmail = findCol(['email', 'mail', 'emailaddress'], ['email', 'mail']);
    const idxDesignation = findCol(['designation', 'role', 'title', 'position'], ['designation']);
    const idxCategory = findCol(['industrycategory', 'industry', 'category', 'type', 'serviceorproduct'], ['industry', 'category']);
    const idxLocation = findCol(['location', 'city', 'place', 'area', 'address'], ['location', 'city', 'place']);
    const idxWebsite = findCol(['website', 'web', 'site', 'companywebsite'], ['website', 'site']);
    const idxSource = findCol(['source', 'leadsource'], ['source']);
    const idxRemarks = findCol(['remarks', 'notes', 'description', 'comment'], ['remarks', 'notes']);

    const rows: ParsedContactRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = splitCSVLine(lines[i]);
      if (values.every((v) => v === '')) continue; // skip completely empty line

      const contactPerson = idxContactPerson !== -1 && values[idxContactPerson] ? values[idxContactPerson].trim() : '';
      const companyName = idxCompany !== -1 && values[idxCompany] ? values[idxCompany].trim() : '';

      const rawId = idxId !== -1 && values[idxId] ? values[idxId].trim() : '';
      let explicitName = idxName !== -1 && values[idxName] ? values[idxName].trim() : '';

      // Priority: Contact Person > Company Name > Explicit Name > Non-numeric ID
      const nonNumericId = rawId && isNaN(Number(rawId)) ? rawId : '';
      const name = contactPerson || explicitName || companyName || nonNumericId || '';
      const rawPhone = idxPhone !== -1 && values[idxPhone] ? values[idxPhone] : '';
      const email = idxEmail !== -1 && values[idxEmail] ? values[idxEmail].trim() : '';
      const designation = idxDesignation !== -1 && values[idxDesignation] ? values[idxDesignation].trim() : '';
      const category = idxCategory !== -1 && values[idxCategory] && values[idxCategory].trim() ? values[idxCategory].trim() : defaultCategory;
      const location = idxLocation !== -1 && values[idxLocation] ? values[idxLocation].trim() : '';
      const website = idxWebsite !== -1 && values[idxWebsite] ? values[idxWebsite].trim() : '';
      const source = idxSource !== -1 && values[idxSource] && values[idxSource].trim() ? values[idxSource].trim() : 'Bulk Import';
      const remarks = idxRemarks !== -1 && values[idxRemarks] ? values[idxRemarks].trim() : '';

      // Normalize phone: extract numbers
      let digits = rawPhone.replace(/\D/g, '');
      if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(-10);
      }

      const errors: string[] = [];
      if (!name.trim()) {
        errors.push('Contact Person or Company Name is required');
      }
      if (!digits) {
        errors.push('Phone number is missing');
      } else if (digits.length !== 10) {
        errors.push(`Invalid phone (${digits.length} digits, must be 10)`);
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email format is invalid');
      }

      rows.push({
        rowNum: i,
        name: name.trim(),
        phone: digits || rawPhone,
        email: email.trim().toLowerCase(),
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim() || name.trim(),
        designation: designation.trim(),
        category: category.trim() || 'Product',
        location: location.trim(),
        source: source.trim() || 'Bulk Import',
        remarks: remarks.trim(),
        website: website.trim(),
        isValid: errors.length === 0,
        errors,
      });
    }

    return rows;
  };

  // 3. Handle File Input Change (Supports .xlsx, .xls, and .csv)
  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);

    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          if (csvText) {
            const rows = parseCSVContent(csvText);
            setParsedRows(rows);
          } else {
            notifications.show({
              title: 'Empty File',
              message: 'No data found in the selected sheet.',
              color: 'orange',
            });
          }
        } catch (err: any) {
          console.error('Failed to parse Excel file:', err);
          notifications.show({
            title: 'Error reading Excel file',
            message: 'Could not read the spreadsheet. Please ensure it is a valid .xlsx, .xls, or .csv file.',
            color: 'red',
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const rows = parseCSVContent(text);
          setParsedRows(rows);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // 4. Submit Bulk Import
  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const contactsToImport = validRows.map((r) => ({
        name: r.name,
        phone: r.phone,
        email: r.email || null,
        companyName: r.companyName || null,
        contactPerson: r.contactPerson || r.name,
        designation: r.designation || null,
        companyWebsite: r.website || null,
        category: r.category || defaultCategory,
        city: r.location || null,
        street: r.location || null,
        location: r.location || null,
        source: r.source || 'Bulk Import',
        remarks: r.remarks || null,
        assignedTo: defaultAssignedTo !== 'Unassigned' ? defaultAssignedTo : null,
      }));

      const res = await bulkImportContacts({
        contacts: contactsToImport,
        defaultAssignedTo: defaultAssignedTo !== 'Unassigned' ? defaultAssignedTo : undefined,
        defaultCategory,
        defaultSource: 'Bulk Import',
        fileName: fileName || 'bulk_contacts.csv',
      });

      if (res.success) {
        setParsedRows([]);
        setFileName(null);
        const importedBatchId = (res as any).batchId || (res as any).batch?.batchId;
        onImportComplete?.(importedBatchId);
        onClose();
      }
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setParsedRows([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  // Build employee list for bulk assignment
  const employeeOptions = useMemo(() => {
    const list = [
      { value: 'Unassigned', label: 'Leave Unassigned (New Contacts)' },
      ...(metadata?.employees?.map((emp) => ({
        value: emp.id,
        label: `${emp.name} (${emp.designation || 'Sales Rep'})`,
      })) || []),
    ];
    const seen = new Set<string>();
    return list.filter((opt) => {
      if (!opt.value || seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [metadata?.employees]);

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      size="xl"
      radius="lg"
      centered
      withCloseButton={true}
      title={
        <Group gap="xs">
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconFileSpreadsheet size={22} stroke={2} />
          </Box>
          <div>
            <Text fw={700} size="md" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
              Bulk Contact Import
            </Text>
            <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              Quickly onboard multiple contacts from CSV / Excel spreadsheets into the CRM.
            </Text>
          </div>
        </Group>
      }
      styles={{
        header: {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #F1F5F9',
          padding: '16px 20px',
        },
        body: {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          padding: '20px',
        },
        content: {
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 20px 40px rgba(0, 0, 0, 0.6)' : '0 20px 40px rgba(0, 0, 0, 0.12)',
          maxWidth: 920,
        },
      }}
    >
      <Stack gap="md">
        {/* Top actions toolbar */}
        <Group justify="space-between" align="center">
          <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
            Upload your contact spreadsheet (.csv format) to stage contacts in bulk.
          </Text>

          <Button
            variant="default"
            size="xs"
            radius="md"
            leftSection={<IconDownload size={14} color="#0284C7" />}
            onClick={handleDownloadTemplate}
            styles={{
              root: {
                height: 32,
                fontSize: 12,
                fontWeight: 600,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
              },
            }}
          >
            Download Sample CSV
          </Button>
        </Group>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,text/csv,text/plain,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {/* Interactive Drag & Drop Area */}
        {!parsedRows.length ? (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragOver
                ? '2px dashed #0284C7'
                : isDark
                ? '2px dashed rgba(255, 255, 255, 0.16)'
                : '2px dashed #CBD5E1',
              borderRadius: 14,
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragOver
                ? isDark
                  ? 'rgba(14, 165, 233, 0.12)'
                  : '#F0F9FF'
                : isDark
                ? '#1E293B'
                : '#F8FAFC',
              transition: 'all 0.15s ease',
            }}
          >
            <Stack align="center" gap={8}>
              <Box
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUpload size={26} stroke={2} />
              </Box>
              <Text fw={600} size="sm" style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}>
                Drag and drop your contact spreadsheet here, or <span style={{ color: '#0284C7' }}>browse</span>
              </Text>
              <Text size="xs" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                Supports .CSV and spreadsheet exports. Columns like Name, Phone (10 digits), Company, and Email are auto-mapped.
              </Text>
            </Stack>
          </Box>
        ) : (
          /* Staging & Validation Overview Panel */
          <Stack gap="md">
            <Paper
              p="md"
              radius="md"
              style={{
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <Group gap="sm">
                  <IconFileSpreadsheet size={24} color="#0284C7" />
                  <div>
                    <Text fw={600} size="sm" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
                      {fileName || 'contacts_import.csv'}
                    </Text>
                    <Group gap={8} mt={2}>
                      <Badge size="sm" color="blue" variant="light">
                        {parsedRows.length} Total Rows
                      </Badge>
                      <Badge size="sm" color="teal" variant="light" leftSection={<IconCheck size={12} />}>
                        {validCount} Valid Ready
                      </Badge>
                      {invalidCount > 0 && (
                        <Badge size="sm" color="red" variant="light" leftSection={<IconAlertTriangle size={12} />}>
                          {invalidCount} Issues Found
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Group>

                {/* Batch Options */}
                <Group gap="sm" align="flex-end" wrap="wrap">
                  <Select
                    label="Assign Imported Contacts To"
                    size="xs"
                    data={employeeOptions}
                    value={defaultAssignedTo}
                    onChange={(val) => setDefaultAssignedTo(val || 'Unassigned')}
                    style={{ width: 200 }}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        fontSize: 12,
                      },
                    }}
                  />

                  <Select
                    label="Default Category"
                    size="xs"
                    data={[
                      { value: 'Product', label: 'Product' },
                      { value: 'Service', label: 'Service' },
                    ]}
                    value={defaultCategory}
                    onChange={(val) => setDefaultCategory(val || 'Product')}
                    style={{ width: 110 }}
                    styles={{
                      input: {
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        fontSize: 12,
                      },
                    }}
                  />

                  <Button
                    variant="default"
                    size="xs"
                    color="gray"
                    onClick={handleClear}
                    leftSection={<IconTrash size={14} />}
                    styles={{ root: { height: 32 } }}
                  >
                    Discard
                  </Button>

                  <Button
                    size="xs"
                    color="blue"
                    disabled={validCount === 0 || importing}
                    loading={importing}
                    onClick={handleConfirmImport}
                    leftSection={<IconCheck size={15} stroke={2.5} />}
                    styles={{
                      root: {
                        height: 32,
                        background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                        fontWeight: 600,
                      },
                    }}
                  >
                    Import {validCount} Contacts
                  </Button>
                </Group>
              </Group>
            </Paper>

            {/* Parsed Contacts Preview Table */}
            <Box style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 8, border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0' }}>
              <Table highlightOnHover striped withTableBorder>
                <Table.Thead style={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                  <Table.Tr>
                    <Table.Th style={{ width: 45, fontSize: 11 }}>#</Table.Th>
                    <Table.Th style={{ width: 90, fontSize: 11 }}>STATUS</Table.Th>
                    <Table.Th style={{ fontSize: 11 }}>ID</Table.Th>
                    <Table.Th style={{ fontSize: 11 }}>PHONE</Table.Th>
                    <Table.Th style={{ fontSize: 11 }}>COMPANY</Table.Th>
                    <Table.Th style={{ fontSize: 11 }}>LOCATION</Table.Th>
                    <Table.Th style={{ fontSize: 11 }}>EMAIL</Table.Th>
                    <Table.Th style={{ fontSize: 11 }}>DESIGNATION</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {parsedRows.map((row) => (
                    <Table.Tr
                      key={row.rowNum}
                      style={{
                        backgroundColor: !row.isValid
                          ? isDark
                            ? 'rgba(239, 68, 68, 0.1)'
                            : '#FEF2F2'
                          : undefined,
                      }}
                    >
                      <Table.Td style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>
                        {row.rowNum}
                      </Table.Td>
                      <Table.Td>
                        {row.isValid ? (
                          <Badge size="xs" color="teal" variant="light">
                            Ready
                          </Badge>
                        ) : (
                          <Tooltip label={row.errors.join(', ')} withArrow position="top">
                            <Badge size="xs" color="red" variant="filled" style={{ cursor: 'pointer' }}>
                              Issue ({row.errors[0]})
                            </Badge>
                          </Tooltip>
                        )}
                      </Table.Td>
                      <Table.Td style={{ fontSize: 12, fontWeight: 600 }}>{row.name}</Table.Td>
                      <Table.Td style={{ fontSize: 12 }}>{row.phone || '—'}</Table.Td>
                      <Table.Td style={{ fontSize: 12 }}>{row.companyName || '—'}</Table.Td>
                      <Table.Td style={{ fontSize: 12 }}>{row.location || '—'}</Table.Td>
                      <Table.Td style={{ fontSize: 12 }}>{row.email || '—'}</Table.Td>
                      <Table.Td style={{ fontSize: 12 }}>{row.designation || '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};

export default BulkImportSection;
