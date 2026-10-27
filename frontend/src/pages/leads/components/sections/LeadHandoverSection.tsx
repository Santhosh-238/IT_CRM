import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Title,
  Badge,
  Card,
  Group,
  Stack,
  Grid,
  Button,
  Paper,
  ActionIcon,
  Tooltip,
  Divider,
  TextInput,
  Select,
  Textarea,
  Modal,
  ThemeIcon,
  SimpleGrid,
  Avatar,
  Tabs,
  Menu,
} from '@mantine/core';
import {
  IconClipboardCheck,
  IconCheck,
  IconEdit,
  IconExternalLink,
  IconCalendar,
  IconBuilding,
  IconPlus,
  IconPaperclip,
  IconTrash,
  IconSend,
  IconFileText,
  IconClock,
  IconArrowRight,
  IconBrandGithub,
  IconBrandFigma,
  IconWorld,
  IconBox,
  IconCalendarEvent,
  IconShieldCheck,
  IconCloudUpload,
  IconUpload,
  IconMessageCircle,
  IconChevronRight,
  IconPackage,
  IconUser,
  IconDownload,
  IconX,
  IconFileCheck,
  IconEye,
  IconRocket,
  IconCircleCheckFilled,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  Lead,
  LeadHandoverData,
  HandoverAttachment,
  HandoverCommentItem,
  LeadProgressData,
} from '../../../../types/lead';
import { useProject } from '../../../../context/ProjectContext';
import { useEmployee } from '../../../../context/EmployeeContext';
import dayjs from 'dayjs';

export interface LeadHandoverSectionProps {
  lead: Lead;
  isDark: boolean;
  handover?: LeadHandoverData;
  progress?: LeadProgressData;
  onUpdateHandover: (handover: LeadHandoverData) => void;
  onNavigateSection: (section: string) => void;
}

// Helper to filter out any auto-generated or boilerplate work lines
export const isUnwantedWorkLine = (line?: string): boolean => {
  if (!line) return true;
  const lower = line.toLowerCase();
  return (
    lower.includes('core frontend') ||
    lower.includes('database schema') ||
    lower.includes('staging environment') ||
    lower.includes('production ssl') ||
    lower.includes('client team admin') ||
    lower.includes('3-month post-delivery') ||
    lower.includes('initial milestone') ||
    lower.includes('architecture baseline') ||
    lower.includes('dashboard module') ||
    lower.includes('final production deployment') ||
    lower.includes('client delivery for') ||
    lower.includes('handover record initialized') ||
    (lower.includes('module') && (lower.includes('in progress') || lower.includes('completed 100%')))
  );
};

export const cleanWorkText = (text?: string): string => {
  if (!text) return '';
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      const stripped = l.replace(/^•\s*/, '').trim();
      return Boolean(stripped) && !isUnwantedWorkLine(stripped);
    })
    .join('\n')
    .trim();
};

// Helper to filter out legacy hardcoded boilerplate comments
export const isUnwantedLegacyComment = (text?: string): boolean => {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('handover package prepared') ||
    lower.includes('module sign-off review') ||
    lower.includes('handover approved and accepted') ||
    lower.includes('handover record initialized') ||
    lower.includes('approval status updated') ||
    lower.includes('handover status updated')
  );
};

export const cleanComments = (comments?: HandoverCommentItem[]): HandoverCommentItem[] => {
  if (!comments || !Array.isArray(comments)) return [];
  return comments.filter((c) => !isUnwantedLegacyComment(c.text));
};

export const LeadHandoverSection: React.FC<LeadHandoverSectionProps> = ({
  lead,
  isDark,
  handover: propHandover,
  progress,
  onUpdateHandover,
  onNavigateSection,
}) => {
  const { projects } = useProject();
  const { employees } = useEmployee();

  // Find linked project dynamically from database
  const linkedProject = useMemo(() => {
    return (
      projects.find(
        (p) =>
          p.contactId === lead.id ||
          p.id === (lead as any).projectId ||
          (p.clientName && lead.name && p.clientName.toLowerCase().includes(lead.name.toLowerCase())) ||
          (p.clientName && lead.companyName && p.clientName.toLowerCase().includes(lead.companyName.toLowerCase()))
      ) || projects[0] || null
    );
  }, [projects, lead]);

  const defaultProjectName = linkedProject?.name || progress?.projectName || 'Project';
  const defaultProjectCode = linkedProject?.projectId || progress?.projectCode || 'P001';
  const defaultPmName = linkedProject?.projectManagerName || 'santhosh';
  const defaultClientName = lead.name ? `${lead.name} (${lead.companyName || 'Client'})` : 'Client';
  const defaultDate = linkedProject?.targetEndDate || dayjs().format('DD-MM-YYYY');
  const projectProgress = linkedProject?.progress ?? progress?.overallPercentage ?? 0;

  // Build real dynamic attachments from project
  const getDynamicDocuments = (project: any): HandoverAttachment[] => {
    const docs: HandoverAttachment[] = [];
    if (project?.liveUrl) {
      docs.push({
        id: 'doc-live',
        name: `${project.name} - Production Environment URL`,
        url: project.liveUrl,
        fileType: 'Live URL',
        fileSize: 'HTTPS Active',
        uploadedAt: dayjs().format('DD-MM-YYYY'),
      });
    }
    if (project?.githubUrl) {
      docs.push({
        id: 'doc-github',
        name: `${project.name} - Source Code Repository`,
        url: project.githubUrl,
        fileType: 'Git Repo',
        fileSize: 'Main Branch',
        uploadedAt: dayjs().format('DD-MM-YYYY'),
      });
    }
    if (project?.figmaUrl) {
      docs.push({
        id: 'doc-figma',
        name: `${project.name} - UI/UX Design System`,
        url: project.figmaUrl,
        fileType: 'Figma Asset',
        fileSize: 'Design Specs',
        uploadedAt: dayjs().format('DD-MM-YYYY'),
      });
    }
    return docs;
  };

  // Initialize handover state strictly with dynamic data without auto-generated clutter
  const [data, setData] = useState<LeadHandoverData>(() => {
    const dynamicDocs = getDynamicDocuments(linkedProject);

    if (propHandover && propHandover.handoverId) {
      return {
        ...propHandover,
        completedWork: cleanWorkText(propHandover.completedWork),
        pendingTasks: cleanWorkText(propHandover.pendingTasks),
        documents:
          propHandover.documents &&
          propHandover.documents.some((d) => d.url?.includes('docs.google.com/document/d/'))
            ? dynamicDocs
            : propHandover.documents || dynamicDocs,
        comments: cleanComments(propHandover.comments),
      };
    }

    return {
      // 1. Handover ID
      handoverId: 'HND-1001',

      // 2. Handover Title
      handoverTitle: `${defaultProjectName} - Client Delivery & Transition`,

      // 3. Handover Type
      handoverType: 'Project Delivery',

      // 4. Project / Module
      projectModule: `${defaultProjectName} (${defaultProjectCode}) / Core Platform`,

      // 5. From Employee
      fromEmployee: defaultPmName,

      // 6. To Employee
      toEmployee: defaultClientName,

      // 7. Handover Date
      handoverDate: defaultDate,

      // 8. Completed Work (Clean, only user-entered items)
      completedWork: '',

      // 9. Pending Tasks (Clean, only user-entered items)
      pendingTasks: '',

      // 10. Documents / Attachments (DYNAMIC from project URLs)
      documents: dynamicDocs,

      // 11. Priority
      priority: linkedProject?.priority || 'High',

      // 12. Approval Status
      approvalStatus: propHandover?.approvalStatus || 'Pending Approval',

      // 13. Handover Status
      handoverStatus: propHandover?.handoverStatus || 'In Progress',

      // 14. Comments (Clean, only user-entered remarks)
      comments: [],

      // Compatibility
      leadId: lead.id,
      projectName: defaultProjectName,
      projectCode: defaultProjectCode,
      status: propHandover?.status || 'In Progress',
    };
  });

  // Automatically clean legacy boilerplate items and sync
  useEffect(() => {
    setData((prev) => {
      const dynamicDocs = linkedProject ? getDynamicDocuments(linkedProject) : prev.documents;
      const updatedDocs =
        prev.documents.length === 0 ||
        prev.documents.some((d) => d.url?.includes('docs.google.com/document/d/'))
          ? dynamicDocs
          : prev.documents;

      const sourceCompleted = propHandover?.completedWork !== undefined ? propHandover.completedWork : prev.completedWork;
      const sourcePending = propHandover?.pendingTasks !== undefined ? propHandover.pendingTasks : prev.pendingTasks;
      const sourceComments = propHandover?.comments !== undefined ? propHandover.comments : prev.comments;

      const cleanedCompleted = cleanWorkText(sourceCompleted);
      const cleanedPending = cleanWorkText(sourcePending);
      const cleanedCommentsList = cleanComments(sourceComments);

      const updated = {
        ...prev,
        ...(propHandover || {}),
        projectName: linkedProject?.name || prev.projectName,
        projectCode: linkedProject?.projectId || prev.projectCode,
        handoverDate: linkedProject?.targetEndDate || prev.handoverDate,
        fromEmployee: linkedProject?.projectManagerName || prev.fromEmployee,
        completedWork: cleanedCompleted,
        pendingTasks: cleanedPending,
        documents: updatedDocs,
        comments: cleanedCommentsList,
      };

      if (
        cleanedCompleted !== prev.completedWork ||
        cleanedPending !== prev.pendingTasks ||
        cleanedCommentsList.length !== (prev.comments?.length || 0)
      ) {
        onUpdateHandover(updated);
      }

      return updated;
    });
  }, [linkedProject, propHandover, lead.id]);

  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<LeadHandoverData>(data);

  // Real File Upload States & References
  interface UploadPendingFile {
    file: File;
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  }

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<UploadPendingFile[]>([]);
  const [optionalDriveUrl, setOptionalDriveUrl] = useState('');
  const [isModalDraggingOver, setIsModalDraggingOver] = useState(false);
  const [isCardDraggingOver, setIsCardDraggingOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<HandoverAttachment | null>(null);

  const getSafeViewerUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('data:application/pdf')) {
      try {
        const parts = url.split(',');
        const base64Data = parts[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      } catch {
        return url;
      }
    }
    return url;
  };

  const isPdfDoc = (doc?: HandoverAttachment | null): boolean => {
    if (!doc) return false;
    const name = (doc.name || '').toLowerCase();
    const type = (doc.fileType || '').toLowerCase();
    const url = (doc.url || '').toLowerCase();
    return (
      type.includes('pdf') ||
      name.endsWith('.pdf') ||
      url.endsWith('.pdf') ||
      url.includes('.pdf?') ||
      url.includes('application/pdf') ||
      url.startsWith('data:application/pdf')
    );
  };

  const isImageDoc = (doc?: HandoverAttachment | null): boolean => {
    if (!doc) return false;
    const name = (doc.name || '').toLowerCase();
    const type = (doc.fileType || '').toLowerCase();
    const url = (doc.url || '').toLowerCase();
    return (
      type.includes('image') ||
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name) ||
      url.startsWith('data:image/')
    );
  };

  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const detectFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'PDF Document';
    if (['doc', 'docx'].includes(ext)) return 'Word Document';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Spreadsheet';
    if (['ppt', 'pptx'].includes(ext)) return 'Presentation';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Archive / ZIP';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'Image Asset';
    if (['fig'].includes(ext)) return 'Figma Asset';
    return 'Document';
  };

  const getFileIcon = (fileType?: string, fileName?: string) => {
    const type = (fileType || fileName || '').toLowerCase();
    if (type.includes('git')) return <IconBrandGithub size={15} />;
    if (type.includes('figma') || type.endsWith('.fig')) return <IconBrandFigma size={15} />;
    if (type.includes('live') || type.includes('http')) return <IconWorld size={15} />;
    if (type.includes('pdf')) return <IconFileText size={15} color="#EF4444" />;
    if (type.includes('word') || type.includes('doc')) return <IconFileText size={15} color="#2563EB" />;
    if (type.includes('spread') || type.includes('xls') || type.includes('csv')) return <IconFileText size={15} color="#10B981" />;
    if (type.includes('zip') || type.includes('archive')) return <IconPackage size={15} color="#F59E0B" />;
    return <IconFileText size={15} color="#3B82F6" />;
  };

  const [newCommentText, setNewCommentText] = useState('');

  const commentsList = useMemo(() => {
    return cleanComments(data.comments);
  }, [data.comments]);

  // Quick Action: Update Approval Status via Dropdown
  const handleUpdateApprovalStatus = (newApproval: string) => {
    let nextHandoverStatus = data.handoverStatus;
    if (newApproval === 'Approved' && data.handoverStatus !== 'Completed') {
      nextHandoverStatus = 'Completed';
    } else if (newApproval !== 'Approved' && data.handoverStatus === 'Completed') {
      nextHandoverStatus = 'In Progress';
    }
    const updated: LeadHandoverData = {
      ...data,
      approvalStatus: newApproval,
      handoverStatus: nextHandoverStatus,
      status: nextHandoverStatus === 'Completed' ? 'Handover Completed' : 'In Progress',
    };
    setData(updated);
    onUpdateHandover(updated);
    notifications.show({
      title: 'Approval Status Updated',
      message: `Status changed to ${newApproval}`,
      color: getApprovalColor(newApproval),
    });
  };

  // Quick Action: Update Handover Status via Dropdown
  const handleUpdateHandoverStatus = (newStatus: string) => {
    let nextApproval = data.approvalStatus;
    if (newStatus === 'Completed' && data.approvalStatus !== 'Approved') {
      nextApproval = 'Approved';
    } else if (newStatus !== 'Completed' && data.approvalStatus === 'Approved') {
      nextApproval = 'Pending Approval';
    }
    const updated: LeadHandoverData = {
      ...data,
      handoverStatus: newStatus,
      approvalStatus: nextApproval,
      status: newStatus === 'Completed' ? 'Handover Completed' : 'In Progress',
    };
    setData(updated);
    onUpdateHandover(updated);
    notifications.show({
      title: 'Handover Status Updated',
      message: `Status changed to ${newStatus}`,
      color: getHandoverStatusColor(newStatus),
    });
  };

  // Save changes from Edit Modal
  const handleSaveEdit = () => {
    setData(editForm);
    onUpdateHandover(editForm);
    setEditModalOpen(false);
    notifications.show({
      title: 'Handover Updated',
      message: 'Handover details updated successfully.',
      color: 'blue',
    });
  };

  // Handle Files Selected from Modal Dropzone
  const handleModalFilesChange = (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newPending: UploadPendingFile[] = [];

    fileArray.forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        notifications.show({
          title: 'File Too Large',
          message: `${file.name} exceeds 25MB limit.`,
          color: 'red',
        });
        return;
      }

      const pendingItem: UploadPendingFile = {
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: detectFileType(file.name),
      };

      const reader = new FileReader();
      reader.onload = () => {
        pendingItem.dataUrl = reader.result as string;
      };
      reader.readAsDataURL(file);

      newPending.push(pendingItem);
    });

    setSelectedUploadFiles((prev) => [...prev, ...newPending]);
    if (modalFileInputRef.current) {
      modalFileInputRef.current.value = '';
    }
  };

  // Remove a pending file from modal list
  const handleRemovePendingFile = (index: number) => {
    setSelectedUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm and attach uploaded files from modal
  const handleConfirmUpload = () => {
    if (selectedUploadFiles.length === 0 && !optionalDriveUrl.trim()) {
      notifications.show({
        title: 'Validation',
        message: 'Please choose at least one file or enter a drive link.',
        color: 'red',
      });
      return;
    }

    const newAttachments: HandoverAttachment[] = selectedUploadFiles.map((item, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      name: item.name,
      url: item.dataUrl || optionalDriveUrl.trim() || undefined,
      fileType: item.type,
      fileSize: item.size,
      uploadedAt: dayjs().format('DD-MM-YYYY'),
    }));

    if (selectedUploadFiles.length === 0 && optionalDriveUrl.trim()) {
      const url = optionalDriveUrl.trim();
      const extractedName = url.split('/').pop()?.split('?')[0] || 'Project Resource';
      const isExtPdf = extractedName.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf');
      newAttachments.push({
        id: `doc-${Date.now()}`,
        name: isExtPdf ? decodeURIComponent(extractedName) : 'Project Resource Link',
        url: url,
        fileType: isExtPdf ? 'PDF Document' : 'Cloud Resource',
        fileSize: 'Cloud Link',
        uploadedAt: dayjs().format('DD-MM-YYYY'),
      });
    }

    const updated = {
      ...data,
      documents: [...data.documents, ...newAttachments],
    };

    setData(updated);
    onUpdateHandover(updated);
    setSelectedUploadFiles([]);
    setOptionalDriveUrl('');
    setDocModalOpen(false);

    notifications.show({
      title: 'Upload Successful',
      message: `${newAttachments.length} document(s) attached to handover.`,
      color: 'teal',
    });
  };

  // Direct Card Upload Handler
  const handleDirectCardUpload = (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    fileArray.forEach((file, idx) => {
      if (file.size > 25 * 1024 * 1024) {
        notifications.show({
          title: 'File Too Large',
          message: `${file.name} exceeds 25MB limit.`,
          color: 'red',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const attachment: HandoverAttachment = {
          id: `doc-${Date.now()}-${idx}`,
          name: file.name,
          url: dataUrl,
          fileType: detectFileType(file.name),
          fileSize: formatFileSize(file.size),
          uploadedAt: dayjs().format('DD-MM-YYYY'),
        };

        setData((prev) => {
          const updatedDocs = [...prev.documents, attachment];
          const updatedData = { ...prev, documents: updatedDocs };
          onUpdateHandover(updatedData);
          return updatedData;
        });
      };
      reader.readAsDataURL(file);
    });

    if (cardFileInputRef.current) {
      cardFileInputRef.current.value = '';
    }

    notifications.show({
      title: 'Files Uploaded',
      message: `${fileArray.length} file(s) attached directly.`,
      color: 'teal',
    });
  };

  // Open or download file handler
  const handleDownloadOrOpenDoc = (doc: HandoverAttachment) => {
    if (!doc.url) return;
    if (doc.url.startsWith('data:') || doc.url.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(doc.url, '_blank');
    }
  };

  // Delete Document
  const handleDeleteDocument = (id: string) => {
    const updated = {
      ...data,
      documents: data.documents.filter((d) => d.id !== id),
    };
    setData(updated);
    onUpdateHandover(updated);
    notifications.show({
      title: 'Attachment Removed',
      message: 'Document deleted from handover.',
      color: 'gray',
    });
  };

  // Delete Comment
  const handleDeleteComment = (commentId: string) => {
    const updatedComments = data.comments.filter((c) => c.id !== commentId);
    const updated = {
      ...data,
      comments: updatedComments,
    };
    setData(updated);
    onUpdateHandover(updated);
    notifications.show({
      title: 'Comment Removed',
      message: 'Remark deleted.',
      color: 'gray',
    });
  };

  // Add Comment
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: HandoverCommentItem = {
      id: `c-${Date.now()}`,
      author: data.fromEmployee || 'User',
      role: 'Team Lead',
      text: newCommentText.trim(),
      createdAt: dayjs().format('DD-MM-YYYY HH:mm'),
    };
    const updated = {
      ...data,
      comments: [...data.comments, newComment],
    };
    setData(updated);
    onUpdateHandover(updated);
    setNewCommentText('');
    notifications.show({
      title: 'Comment Posted',
      message: 'Your comment has been added to the handover record.',
      color: 'blue',
    });
  };

  // Priority badge styling
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'blue';
    }
  };

  // Approval Status badge styling
  const getApprovalColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'teal';
      case 'Pending Approval':
        return 'yellow';
      case 'Revision Requested':
        return 'orange';
      case 'Rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Handover Status badge styling
  const getHandoverStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'teal';
      case 'In Progress':
        return 'blue';
      case 'Submitted':
        return 'indigo';
      case 'Draft':
        return 'gray';
      case 'On Hold':
        return 'red';
      default:
        return 'blue';
    }
  };

  // Employee options for dropdowns
  const employeeOptions = useMemo(() => {
    const list = employees.map((emp) => ({
      value: emp.name,
      label: `${emp.name} (${emp.designation || emp.role || 'Staff'})`,
    }));
    if (!list.some((o) => o.value.toLowerCase().includes('santhosh'))) {
      list.unshift({ value: 'santhosh', label: 'santhosh (Project Manager)' });
    }
    return list;
  }, [employees]);

  const toOptions = useMemo(() => {
    const list = [...employeeOptions];
    if (lead.name) {
      list.unshift({
        value: `${lead.name} (${lead.companyName || 'Client Rep'})`,
        label: `${lead.name} (${lead.companyName || 'Client Rep'})`,
      });
    }
    return list;
  }, [employeeOptions, lead]);

  // Step index resolution helpers
  const getApprovalStepIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('init') || s.includes('draft') || s.includes('pend')) return 0;
    if (s.includes('review') || s.includes('revis')) return 1;
    if (s.includes('approv') && !s.includes('pend')) return 2;
    if (s.includes('complete') || s.includes('close')) return 3;
    return 0;
  };

  const getHandoverStepIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('prog') || s.includes('draft')) return 0;
    if (s.includes('test') || s.includes('submit')) return 1;
    if (s.includes('live') || s.includes('deploy')) return 2;
    if (s.includes('close') || s.includes('complet')) return 3;
    return 0;
  };

  const handleApprovalStepClick = (stepName: string) => {
    let mapped = stepName;
    if (stepName === 'Initiated') mapped = 'Pending Approval';
    else if (stepName === 'Review') mapped = 'Revision Requested';
    else if (stepName === 'Approval') mapped = 'Approved';
    else if (stepName === 'Completed') mapped = 'Approved';
    handleUpdateApprovalStatus(mapped);
  };

  const handleHandoverStepClick = (stepName: string) => {
    let mapped = stepName;
    if (stepName === 'Closed') mapped = 'Completed';
    handleUpdateHandoverStatus(mapped);
  };

  // Connected Pipeline Ribbon Stage Definitions
  const approvalPipelineStages = [
    {
      name: 'Initiated',
      label: 'Initiated',
      icon: IconSend,
      desc: 'Package initialized, documents & deliverables attached.',
    },
    {
      name: 'Review',
      label: 'Review',
      icon: IconEye,
      desc: 'Technical & operational assessment in progress.',
    },
    {
      name: 'Approval',
      label: 'Approval',
      icon: IconShieldCheck,
      desc: 'Managerial sign-off & client authorization granted.',
    },
    {
      name: 'Completed',
      label: 'Completed',
      icon: IconCircleCheckFilled,
      desc: 'All approval criteria satisfied and finalized.',
    },
  ];

  const handoverPipelineStages = [
    {
      name: 'In Progress',
      label: 'In Progress',
      icon: IconClock,
      desc: 'Operational checklist & transition activities underway.',
    },
    {
      name: 'Testing',
      label: 'Testing',
      icon: IconFileCheck,
      desc: 'UAT verification, deliverables validation & staging checks.',
    },
    {
      name: 'Go Live',
      label: 'Go Live',
      icon: IconRocket,
      desc: 'Production deployment & live operations handover.',
    },
    {
      name: 'Closed',
      label: 'Closed',
      icon: IconCircleCheckFilled,
      desc: 'Handover complete — client has taken full ownership.',
    },
  ];

  // Modern Salesforce/Linear Connected Pipeline Ribbon Renderer
  const renderPipelineRibbon = (
    stages: Array<{ name: string; label: string; icon: any; desc: string }>,
    activeIdx: number,
    onStepClick: (stepName: string) => void,
    isApproval: boolean = false
  ) => {
    const currentStage = stages[activeIdx] || stages[0];
    const canAdvance = activeIdx < stages.length - 1;
    const nextStage = canAdvance ? stages[activeIdx + 1] : null;

    return (
      <Stack gap={10} mt="xs">
        {/* Connected Chevron Pipeline Ribbon Track */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'stretch',
            width: '100%',
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F1F5F9',
            padding: 3,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            gap: 3,
          }}
        >
          {stages.map((stage, idx) => {
            const isActive = idx === activeIdx;
            const isCompleted = idx < activeIdx;
            const isFirst = idx === 0;
            const isLast = idx === stages.length - 1;
            const StageIcon = stage.icon;

            const clipPath = isFirst
              ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
              : isLast
              ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)'
              : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)';

            let bg = isDark ? '#1E293B' : '#FFFFFF';
            let textColor = isDark ? '#94A3B8' : '#64748B';
            let iconColor = isDark ? '#64748B' : '#94A3B8';
            let fontWeight = 500;
            let shadow = 'none';

            if (isActive) {
              bg = isApproval && data.approvalStatus === 'Revision Requested'
                ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
              textColor = '#FFFFFF';
              iconColor = '#FFFFFF';
              fontWeight = 700;
              shadow = '0 3px 10px rgba(37, 99, 235, 0.35)';
            } else if (isCompleted) {
              bg = isDark ? 'rgba(16, 185, 129, 0.22)' : '#DCFCE7';
              textColor = isDark ? '#34D399' : '#15803D';
              iconColor = isDark ? '#34D399' : '#16A34A';
              fontWeight = 600;
            }

            return (
              <Box
                key={stage.name}
                onClick={() => onStepClick(stage.name)}
                style={{
                  flex: 1,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isFirst ? '0 14px 0 10px' : isLast ? '0 10px 0 16px' : '0 12px 0 16px',
                  background: bg,
                  clipPath: clipPath,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: shadow,
                  userSelect: 'none',
                }}
              >
                <Group gap={6} align="center" wrap="nowrap">
                  {isCompleted ? (
                    <Box
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: iconColor,
                        flexShrink: 0,
                      }}
                    >
                      <IconCheck size={11} stroke={3} />
                    </Box>
                  ) : isActive ? (
                    <Box
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      <StageIcon size={11} stroke={2.5} />
                    </Box>
                  ) : (
                    <Box
                      style={{
                        width: 17,
                        height: 17,
                        borderRadius: '50%',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#94A3B8' : '#64748B',
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>
                  )}
                  <Text
                    size="11.5px"
                    fw={fontWeight}
                    style={{
                      color: textColor,
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {stage.label}
                  </Text>
                </Group>
              </Box>
            );
          })}
        </Box>

        {/* Dynamic Context Micro-Bar with 1-Click Advance */}
        <Paper
          p="xs"
          radius="md"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={8} align="center" style={{ minWidth: 0, flex: 1 }}>
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: activeIdx === 3 ? '#10B981' : '#2563EB',
                  boxShadow: activeIdx === 3
                    ? '0 0 8px rgba(16, 185, 129, 0.6)'
                    : '0 0 8px rgba(37, 99, 235, 0.6)',
                  flexShrink: 0,
                }}
              />
              <Text size="11px" c="dimmed" truncate style={{ flex: 1 }}>
                <Text span fw={700} c={isDark ? '#F1F5F9' : '#0F172A'}>
                  {currentStage.name}:{' '}
                </Text>
                {currentStage.desc}
              </Text>
            </Group>

            {canAdvance && nextStage && (
              <Button
                size="compact-xs"
                variant="light"
                color={isApproval ? 'teal' : 'blue'}
                radius="md"
                rightSection={<IconArrowRight size={11} />}
                onClick={() => onStepClick(nextStage.name)}
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                  padding: '0 10px',
                  flexShrink: 0,
                }}
              >
                Advance to {nextStage.name}
              </Button>
            )}

            {!canAdvance && (
              <Badge
                size="sm"
                variant="light"
                color="teal"
                radius="md"
                leftSection={<IconCheck size={11} stroke={3} />}
                style={{ flexShrink: 0, fontWeight: 700 }}
              >
                Finalized
              </Badge>
            )}
          </Group>
        </Paper>
      </Stack>
    );
  };

  return (
    <Box p={{ base: 'xs', sm: 'md' }}>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (MATCHING REFERENCE IMAGE)                           */}
      {/* ========================================================================= */}
      <Paper
        p="md"
        radius="16px"
        mb="md"
        style={{
          background: isDark ? '#1E293B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="md" align="center">
            {/* 3D Cube Icon Box */}
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <IconBox size={26} stroke={1.8} />
            </Box>

            <div>
              <Group gap="xs" align="center">
                <Badge size="md" radius="md" color="blue" variant="filled">
                  {data.handoverId}
                </Badge>
                <Title
                  order={3}
                  fw={700}
                  style={{
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    letterSpacing: '-0.02em',
                    fontSize: '18px',
                  }}
                >
                  {data.handoverTitle}
                </Title>
              </Group>

              {/* Quick summary metadata pills */}
              <Group gap="xs" mt={6} wrap="wrap" align="center">
                <Badge
                  size="sm"
                  variant="light"
                  color="indigo"
                  radius="md"
                  leftSection={<IconPackage size={12} />}
                >
                  {data.handoverType}
                </Badge>
                <Text size="12px" c="dimmed">•</Text>
                <Group gap={4}>
                  <IconBuilding size={13} color="#3B82F6" />
                  <Text size="12px" fw={600} c={isDark ? '#CBD5E1' : '#475569'}>
                    {data.projectModule}
                  </Text>
                </Group>
                <Text size="12px" c="dimmed">•</Text>
                <Group gap={4}>
                  <IconCalendar size={13} color="#10B981" />
                  <Text size="12px" fw={600} c={isDark ? '#CBD5E1' : '#475569'}>
                    {data.handoverDate}
                  </Text>
                </Group>
                <Text size="12px" c="dimmed">•</Text>
                <Badge
                  size="sm"
                  variant="light"
                  radius="md"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    color: '#DC2626',
                    fontWeight: 700,
                  }}
                >
                  Priority: {data.priority}
                </Badge>
              </Group>
            </div>
          </Group>

          {/* Action buttons */}
          <Group gap="sm" align="center">
            <Button
              variant="default"
              size="xs"
              radius="md"
              leftSection={<IconEdit size={14} />}
              onClick={() => {
                setEditForm(data);
                setEditModalOpen(true);
              }}
            >
              Edit Handover
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* ========================================================================= */}
      {/* 2. ROW 1: PROJECT & MILESTONE DETAILS + LIFECYCLE & APPROVAL GOVERNANCE   */}
      {/* ========================================================================= */}
      <Grid gutter="md" mb="md">
        {/* LEFT CARD: Project & Milestone Details */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card
            p="md"
            radius="16px"
            withBorder
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Group justify="space-between" align="center" mb="md">
              <Group gap="xs" align="center">
                <ThemeIcon size={30} radius="md" color="blue" variant="light">
                  <IconCalendarEvent size={18} />
                </ThemeIcon>
                <Text fw={700} size="14px" c={isDark ? '#F8FAFC' : '#0F172A'}>
                  Project & Milestone Details
                </Text>
              </Group>
              <Badge size="sm" variant="light" color="indigo" radius="md">
                {data.handoverType}
              </Badge>
            </Group>

            <Stack gap="md" style={{ flex: 1, justifyContent: 'space-around' }}>
              {/* Row 1: Handover ID */}
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  <ThemeIcon size={32} radius="xl" color="blue" variant="light">
                    <IconBox size={16} />
                  </ThemeIcon>
                  <Text size="13px" c="dimmed">Handover ID</Text>
                </Group>
                <Badge size="md" variant="light" color="blue" radius="md" style={{ fontWeight: 700 }}>
                  {data.handoverId}
                </Badge>
              </Group>

              {/* Row 2: Handover Type */}
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  <ThemeIcon size={32} radius="xl" color="indigo" variant="light">
                    <IconClipboardCheck size={16} />
                  </ThemeIcon>
                  <Text size="13px" c="dimmed">Handover Type</Text>
                </Group>
                <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                  {data.handoverType}
                </Text>
              </Group>

              {/* Row 3: Target Module */}
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  <ThemeIcon size={32} radius="xl" color="cyan" variant="light">
                    <IconBuilding size={16} />
                  </ThemeIcon>
                  <Text size="13px" c="dimmed">Target Module</Text>
                </Group>
                <Group gap={6}>
                  <IconBuilding size={14} color="#3B82F6" />
                  <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                    {data.projectModule}
                  </Text>
                </Group>
              </Group>

              {/* Row 4: Handover Date */}
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  <ThemeIcon size={32} radius="xl" color="teal" variant="light">
                    <IconCalendar size={16} />
                  </ThemeIcon>
                  <Text size="13px" c="dimmed">Handover Date</Text>
                </Group>
                <Group gap={6}>
                  <IconCalendar size={14} color="#10B981" />
                  <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                    {data.handoverDate}
                  </Text>
                </Group>
              </Group>

              {/* Row 5: Priority */}
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  <ThemeIcon size={32} radius="xl" color="red" variant="light">
                    <IconShieldCheck size={16} />
                  </ThemeIcon>
                  <Text size="13px" c="dimmed">Priority</Text>
                </Group>
                <Badge
                  size="md"
                  radius="md"
                  variant="light"
                  color={getPriorityColor(data.priority)}
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    color: '#DC2626',
                    fontWeight: 700,
                  }}
                >
                  {data.priority}
                </Badge>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* RIGHT CARD: Lifecycle & Approval Governance */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card
            p="md"
            radius="16px"
            withBorder
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Group justify="space-between" align="center" mb="md">
              <Group gap="xs" align="center">
                <ThemeIcon size={30} radius="md" color="blue" variant="light">
                  <IconShieldCheck size={18} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="14px" c={isDark ? '#F8FAFC' : '#0F172A'}>
                    Lifecycle & Approval Governance
                  </Text>
                  <Text size="11px" c="dimmed">
                    Connected pipeline tracks for review, verification & operational handover
                  </Text>
                </div>
              </Group>

              <Badge
                size="sm"
                variant="light"
                color={data.approvalStatus === 'Approved' ? 'teal' : 'blue'}
                radius="md"
              >
                {data.approvalStatus === 'Approved' ? 'Approval Complete' : data.approvalStatus}
              </Badge>
            </Group>

            <Box style={{ flex: 1 }}>
              {/* Approval Status */}
              <Paper
                p="md"
                radius="md"
                withBorder
                style={{
                  backgroundColor: isDark ? '#0F172A' : '#FAFAFA',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Group justify="space-between" align="center" mb="xs">
                  <Group gap="xs" align="center">
                    <ThemeIcon size={34} radius="md" color="teal" variant="light" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                      <IconCheck size={18} color="#10B981" />
                    </ThemeIcon>
                    <div>
                      <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                        Approval Status
                      </Text>
                      <Text size="11px" c="dimmed">
                        Sign-off, confirmation and authorization
                      </Text>
                    </div>
                  </Group>

                  <Menu shadow="md" width={180}>
                    <Menu.Target>
                      <Group gap={4} style={{ cursor: 'pointer' }}>
                        <Badge size="md" color={getApprovalColor(data.approvalStatus)} variant="light" radius="md">
                          {data.approvalStatus}
                        </Badge>
                        <IconChevronRight size={14} color="#64748B" />
                      </Group>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Select Approval Status</Menu.Label>
                      {['Pending Approval', 'Approved', 'Revision Requested', 'Rejected'].map((st) => (
                        <Menu.Item key={st} onClick={() => handleUpdateApprovalStatus(st)}>
                          {st}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </Group>

                {/* Connected Pipeline Ribbon */}
                {renderPipelineRibbon(
                  approvalPipelineStages,
                  getApprovalStepIndex(data.approvalStatus),
                  handleApprovalStepClick,
                  true
                )}
              </Paper>
            </Box>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ========================================================================= */}
      {/* 3. ROW 2: DOCUMENTS & DELIVERABLES + COMMENTS & REMARKS (NO QUICK SUMMARY) */}
      {/* ========================================================================= */}
      <Grid gutter="md">
        {/* DOCUMENTS & DELIVERABLES (50% WIDTH) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card
            p="md"
            radius="16px"
            withBorder
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 280,
            }}
          >
            <Group justify="space-between" align="center" mb="sm">
              <Group gap="xs" align="center">
                <ThemeIcon size={30} radius="md" color="blue" variant="light">
                  <IconFileText size={18} />
                </ThemeIcon>
                <Text fw={700} size="14px" c={isDark ? '#F8FAFC' : '#0F172A'}>
                  Documents & Deliverables
                </Text>
              </Group>
              <Group gap="xs">
                <Badge size="sm" variant="light" color="blue" radius="md">
                  {data.documents?.length || 0}
                </Badge>
                {data.documents && data.documents.length > 0 && (
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="blue"
                    radius="md"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => setDocModalOpen(true)}
                  >
                    Attach File
                  </Button>
                )}
              </Group>
            </Group>

            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Hidden direct card file input */}
              <input
                type="file"
                ref={cardFileInputRef}
                style={{ display: 'none' }}
                multiple
                onChange={(e) => handleDirectCardUpload(e.target.files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg,.fig"
              />

              {data.documents && data.documents.length > 0 ? (
                <Stack gap="xs" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {data.documents.map((doc) => (
                    <Paper
                      key={doc.id}
                      p="xs"
                      radius="md"
                      withBorder
                      style={{
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Group gap="xs" style={{ overflow: 'hidden' }}>
                          <ThemeIcon size={28} radius="sm" color="blue" variant="light">
                            {getFileIcon(doc.fileType, doc.name)}
                          </ThemeIcon>
                          <div
                            style={{ minWidth: 0, cursor: doc.url ? 'pointer' : 'default' }}
                            onClick={() => doc.url && setPreviewDoc(doc)}
                            title={doc.url ? 'Click to preview document' : undefined}
                          >
                            <Text size="12px" fw={600} c={isDark ? '#F8FAFC' : '#0F172A'} lineClamp={1}>
                              {doc.name}
                            </Text>
                            <Group gap={6}>
                              <Text size="10px" c="dimmed">
                                {doc.fileType || 'Document'}
                              </Text>
                              {doc.fileSize && (
                                <>
                                  <Text size="10px" c="dimmed">•</Text>
                                  <Text size="10px" c="dimmed">{doc.fileSize}</Text>
                                </>
                              )}
                            </Group>
                          </div>
                        </Group>
                        <Group gap={4}>
                          {/* 1. VIEW / PREVIEW BUTTON (IconEye) */}
                          {doc.url && (
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={() => setPreviewDoc(doc)}
                              title="View / Preview Document"
                            >
                              <IconEye size={15} />
                            </ActionIcon>
                          )}

                          {/* 2. DOWNLOAD BUTTON */}
                          {doc.url && (
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="teal"
                              onClick={() => handleDownloadOrOpenDoc(doc)}
                              title={doc.url?.startsWith('data:') || doc.url?.startsWith('blob:') ? 'Download file' : 'Open resource'}
                            >
                              {doc.url?.startsWith('data:') || doc.url?.startsWith('blob:') ? (
                                <IconDownload size={15} />
                              ) : (
                                <IconExternalLink size={15} />
                              )}
                            </ActionIcon>
                          )}

                          {/* 3. DELETE BUTTON */}
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteDocument(doc.id)}
                            title="Delete attachment"
                          >
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper
                  p="xl"
                  radius="md"
                  onClick={() => cardFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsCardDraggingOver(true);
                  }}
                  onDragLeave={() => setIsCardDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsCardDraggingOver(false);
                    handleDirectCardUpload(e.dataTransfer.files);
                  }}
                  style={{
                    border: isCardDraggingOver
                      ? '2px dashed #2563EB'
                      : isDark
                      ? '1px dashed rgba(255, 255, 255, 0.15)'
                      : '1px dashed #CBD5E1',
                    backgroundColor: isCardDraggingOver
                      ? isDark
                        ? 'rgba(37, 99, 235, 0.15)'
                        : '#EFF6FF'
                      : isDark
                      ? 'rgba(15, 23, 42, 0.4)'
                      : '#F8FAFC',
                    textAlign: 'center',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 180,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ThemeIcon size={44} radius="xl" color="blue" variant="light" mb="xs">
                    <IconCloudUpload size={24} />
                  </ThemeIcon>
                  <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                    No documents uploaded yet
                  </Text>
                  <Text size="11px" c="dimmed" mt={2} mb="md">
                    Click to browse or drag & drop files here to upload
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    radius="md"
                    leftSection={<IconUpload size={13} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDocModalOpen(true);
                    }}
                  >
                    Upload Files
                  </Button>
                </Paper>
              )}
            </Box>
          </Card>
        </Grid.Col>

        {/* COMMENTS & REMARKS (50% WIDTH) */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card
            p="md"
            radius="16px"
            withBorder
            style={{
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              boxShadow: isDark ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 280,
            }}
          >
            <Group justify="space-between" align="center" mb="sm">
              <Group gap="xs" align="center">
                <ThemeIcon size={30} radius="md" color="blue" variant="light">
                  <IconSend size={16} />
                </ThemeIcon>
                <Text fw={700} size="14px" c={isDark ? '#F8FAFC' : '#0F172A'}>
                  Comments & Remarks
                </Text>
              </Group>
              <Badge size="sm" variant="light" color="blue" radius="md">
                {commentsList.length}
              </Badge>
            </Group>

            <Box style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {commentsList && commentsList.length > 0 ? (
                <Stack gap="xs" mb="sm" style={{ maxHeight: 220, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                  {commentsList.map((comment) => (
                    <Paper
                      key={comment.id}
                      p="xs"
                      radius="12px"
                      withBorder
                      style={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Group align="flex-start" gap="sm" wrap="nowrap">
                        {/* Author Avatar */}
                        <Avatar
                          size={32}
                          radius="xl"
                          color="blue"
                          variant="filled"
                          style={{
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}
                        >
                          {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                        </Avatar>

                        {/* Author Header & Message */}
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Group justify="space-between" align="center" mb={4}>
                            <Group gap={6} align="center">
                              <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                                {comment.author}
                              </Text>
                              {comment.role && (
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color="indigo"
                                  radius="sm"
                                  style={{ fontWeight: 600, fontSize: '10px', textTransform: 'none' }}
                                >
                                  {comment.role}
                                </Badge>
                              )}
                            </Group>

                            <Group gap={6} align="center">
                              <Text size="11px" c="dimmed">
                                {comment.createdAt}
                              </Text>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                radius="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                title="Delete comment"
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>

                          {/* Message Text */}
                          <Text
                            size="13px"
                            c={isDark ? '#E2E8F0' : '#334155'}
                            style={{ lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                          >
                            {comment.text}
                          </Text>
                        </Box>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper
                  p="md"
                  radius="md"
                  mb="sm"
                  style={{
                    border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #CBD5E1',
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#F8FAFC',
                    textAlign: 'center',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 140,
                  }}
                >
                  <ThemeIcon size={40} radius="xl" color="blue" variant="light" mb="xs">
                    <IconMessageCircle size={22} />
                  </ThemeIcon>
                  <Text size="13px" fw={700} c={isDark ? '#F8FAFC' : '#0F172A'}>
                    No comments yet
                  </Text>
                  <Text size="11px" c="dimmed" mt={2}>
                    Add remarks or comments about this handover.
                  </Text>
                </Paper>
              )}

              {/* Bottom Input */}
              <Group gap="xs" align="center" mt="auto">
                <TextInput
                  placeholder="Add a remark or comment..."
                  size="sm"
                  radius="xl"
                  style={{ flex: 1 }}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="sm"
                  radius="xl"
                  color="blue"
                  variant="filled"
                  leftSection={<IconSend size={14} />}
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim()}
                >
                  Send
                </Button>
              </Group>
            </Box>
          </Card>
        </Grid.Col>
      </Grid>

      {/* ========================================================================= */}
      {/* 3. EDIT HANDOVER MODAL (ALL 14 FIELDS EDITABLE)                           */}
      {/* ========================================================================= */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon size={28} radius="md" color="blue" variant="light">
              <IconEdit size={16} />
            </ThemeIcon>
            <Text fw={700} size="15px">
              Edit Handover Record
            </Text>
          </Group>
        }
        size="lg"
        radius="14px"
      >
        <Stack gap="sm">
          {/* 1. Handover ID & 2. Handover Title */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Handover ID"
              placeholder="e.g. HND-1001"
              value={editForm.handoverId}
              onChange={(e) => setEditForm({ ...editForm, handoverId: e.target.value })}
              required
            />
            <TextInput
              label="Handover Title"
              placeholder="e.g. Client Delivery & Transition"
              value={editForm.handoverTitle}
              onChange={(e) => setEditForm({ ...editForm, handoverTitle: e.target.value })}
              required
            />
          </SimpleGrid>

          {/* 3. Handover Type & 4. Project / Module */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="Handover Type"
              data={[
                'Project Delivery',
                'Module Release',
                'Client Handover',
                'Internal Transition',
                'Shift / Task Handover',
                'Maintenance & Support',
              ]}
              value={editForm.handoverType}
              onChange={(val) => setEditForm({ ...editForm, handoverType: val || 'Project Delivery' })}
              required
            />
            <TextInput
              label="Project / Module"
              placeholder="e.g. venus (P001) / Core Platform"
              value={editForm.projectModule}
              onChange={(e) => setEditForm({ ...editForm, projectModule: e.target.value })}
              required
            />
          </SimpleGrid>

          {/* 5. From Employee & 6. To Employee */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="From Employee"
              data={employeeOptions}
              value={editForm.fromEmployee}
              onChange={(val) => setEditForm({ ...editForm, fromEmployee: val || '' })}
              searchable
              required
            />
            <Select
              label="To Employee / Client"
              data={toOptions}
              value={editForm.toEmployee}
              onChange={(val) => setEditForm({ ...editForm, toEmployee: val || '' })}
              searchable
              required
            />
          </SimpleGrid>

          {/* 7. Handover Date, 11. Priority, 12. Approval Status, 13. Handover Status */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Handover Date"
              placeholder="DD-MM-YYYY"
              value={editForm.handoverDate}
              onChange={(e) => setEditForm({ ...editForm, handoverDate: e.target.value })}
              required
            />
            <Select
              label="Priority"
              data={['Low', 'Medium', 'High', 'Critical']}
              value={editForm.priority}
              onChange={(val) => setEditForm({ ...editForm, priority: val || 'High' })}
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="Approval Status"
              data={['Pending Approval', 'Approved', 'Rejected', 'Revision Requested']}
              value={editForm.approvalStatus}
              onChange={(val) => setEditForm({ ...editForm, approvalStatus: val || 'Pending Approval' })}
              required
            />
            <Select
              label="Handover Status"
              data={['Draft', 'In Progress', 'Submitted', 'Completed', 'On Hold']}
              value={editForm.handoverStatus}
              onChange={(val) => setEditForm({ ...editForm, handoverStatus: val || 'In Progress' })}
              required
            />
          </SimpleGrid>

          {/* 8. Completed Work */}
          <Textarea
            label="Completed Work"
            placeholder="List completed deliverables, modules, testing milestones..."
            minRows={3}
            autosize
            value={editForm.completedWork}
            onChange={(e) => setEditForm({ ...editForm, completedWork: e.target.value })}
          />

          {/* 9. Pending Tasks */}
          <Textarea
            label="Pending Tasks"
            placeholder="List pending activities, configurations, warranty items..."
            minRows={3}
            autosize
            value={editForm.pendingTasks}
            onChange={(e) => setEditForm({ ...editForm, pendingTasks: e.target.value })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={handleSaveEdit}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              Save Handover
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. ATTACH / UPLOAD DOCUMENT MODAL                                         */}
      {/* ========================================================================= */}
      <Modal
        opened={docModalOpen}
        onClose={() => {
          setSelectedUploadFiles([]);
          setOptionalDriveUrl('');
          setDocModalOpen(false);
        }}
        title={
          <Group gap="xs">
            <ThemeIcon size={30} radius="md" color="blue" variant="light">
              <IconCloudUpload size={18} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="15px" c={isDark ? '#F8FAFC' : '#0F172A'}>
                Upload Document / Resource
              </Text>
              <Text size="11px" c="dimmed">
                Attach project files, handover deliverables, or cloud resources
              </Text>
            </div>
          </Group>
        }
        radius="16px"
        size="md"
        centered
      >
        <Stack gap="md">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={modalFileInputRef}
            style={{ display: 'none' }}
            multiple
            onChange={(e) => handleModalFilesChange(e.target.files)}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg,.fig"
          />

          {/* Drag & Drop Area */}
          <Paper
            p="xl"
            radius="14px"
            onClick={() => modalFileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsModalDraggingOver(true);
            }}
            onDragLeave={() => setIsModalDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsModalDraggingOver(false);
              handleModalFilesChange(e.dataTransfer.files);
            }}
            style={{
              border: isModalDraggingOver
                ? '2px dashed #2563EB'
                : isDark
                ? '2px dashed rgba(255, 255, 255, 0.18)'
                : '2px dashed #93C5FD',
              backgroundColor: isModalDraggingOver
                ? isDark
                  ? 'rgba(37, 99, 235, 0.15)'
                  : '#EFF6FF'
                : isDark
                ? 'rgba(15, 23, 42, 0.6)'
                : '#F0F7FF',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <ThemeIcon
              size={52}
              radius="xl"
              color="blue"
              variant="light"
              mb="sm"
              style={{
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
              }}
            >
              <IconCloudUpload size={28} />
            </ThemeIcon>
            <Text fw={700} size="14px" c={isDark ? '#F8FAFC' : '#0F172A'}>
              Drag & drop files here, or <Text span c="blue" inherit style={{ textDecoration: 'underline' }}>browse</Text>
            </Text>
            <Text size="11px" c="dimmed" mt={4}>
              Supports PDF, DOCX, XLSX, PPTX, ZIP, PNG, JPG (up to 25MB)
            </Text>
          </Paper>

          {/* Selected Files Preview List */}
          {selectedUploadFiles.length > 0 && (
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text size="11px" fw={700} c="dimmed" tt="uppercase">
                  Ready to Attach ({selectedUploadFiles.length})
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  onClick={() => setSelectedUploadFiles([])}
                >
                  Clear All
                </Button>
              </Group>

              <Stack gap="xs" style={{ maxHeight: 180, overflowY: 'auto' }}>
                {selectedUploadFiles.map((item, idx) => (
                  <Paper
                    key={idx}
                    p="xs"
                    radius="md"
                    withBorder
                    style={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <ThemeIcon size={30} radius="md" color="blue" variant="light">
                          {getFileIcon(item.type, item.name)}
                        </ThemeIcon>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="12px" fw={600} truncate c={isDark ? '#F8FAFC' : '#0F172A'}>
                            {item.name}
                          </Text>
                          <Group gap={6}>
                            <Badge size="xs" variant="light" color="blue" radius="sm">
                              {item.type}
                            </Badge>
                            <Text size="10px" c="dimmed">
                              {item.size}
                            </Text>
                          </Group>
                        </Box>
                      </Group>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePendingFile(idx);
                        }}
                        title="Remove file"
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}

          {/* Optional Drive / Cloud URL */}
          <TextInput
            label="Drive / Cloud Resource URL (Optional)"
            placeholder="e.g. https://drive.google.com/..."
            size="sm"
            radius="md"
            leftSection={<IconWorld size={14} />}
            value={optionalDriveUrl}
            onChange={(e) => setOptionalDriveUrl(e.target.value)}
          />

          {/* Modal Action Buttons */}
          <Group justify="flex-end" mt="xs" gap="xs">
            <Button
              variant="default"
              radius="md"
              onClick={() => {
                setSelectedUploadFiles([]);
                setOptionalDriveUrl('');
                setDocModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              radius="md"
              color="blue"
              onClick={handleConfirmUpload}
              disabled={selectedUploadFiles.length === 0 && !optionalDriveUrl.trim()}
              leftSection={<IconUpload size={14} />}
              style={{
                background:
                  selectedUploadFiles.length > 0 || optionalDriveUrl.trim()
                    ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                    : undefined,
              }}
            >
              {selectedUploadFiles.length > 1
                ? `Attach ${selectedUploadFiles.length} Documents`
                : 'Attach Document'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. DOCUMENT / PDF PREVIEW MODAL                                           */}
      {/* ========================================================================= */}
      <Modal
        opened={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={
          <Group gap="xs">
            <ThemeIcon size={32} radius="md" color="blue" variant="light">
              {previewDoc && getFileIcon(previewDoc.fileType, previewDoc.name)}
            </ThemeIcon>
            <div style={{ maxWidth: 450 }}>
              <Text fw={700} size="14px" c={isDark ? '#F8FAFC' : '#0F172A'} truncate>
                {previewDoc?.name}
              </Text>
              <Group gap={6} mt={2}>
                <Badge size="xs" variant="light" color="blue" radius="sm">
                  {previewDoc?.fileType || 'Document'}
                </Badge>
                {previewDoc?.fileSize && (
                  <Text size="11px" c="dimmed">
                    {previewDoc.fileSize}
                  </Text>
                )}
              </Group>
            </div>
          </Group>
        }
        size="xl"
        radius="16px"
        centered
        styles={{
          body: { padding: '16px 20px 20px' },
        }}
      >
        <Stack gap="md">
          {/* Action Toolbar */}
          <Group justify="space-between" align="center">
            <Text size="12px" c="dimmed">
              Previewing attached file
            </Text>
            <Group gap="xs">
              {previewDoc?.url && (
                <>
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconDownload size={14} />}
                    onClick={() => previewDoc && handleDownloadOrOpenDoc(previewDoc)}
                  >
                    Download
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    leftSection={<IconExternalLink size={14} />}
                    onClick={() => {
                      if (!previewDoc?.url) return;
                      const safeUrl = getSafeViewerUrl(previewDoc.url);
                      window.open(safeUrl, '_blank');
                    }}
                  >
                    Open in New Tab
                  </Button>
                </>
              )}
            </Group>
          </Group>

          {/* Viewer Content */}
          {previewDoc && (
            isPdfDoc(previewDoc) ? (
              <Box
                style={{
                  width: '100%',
                  height: '75vh',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1',
                  backgroundColor: '#525659',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                <iframe
                  src={getSafeViewerUrl(previewDoc.url)}
                  title={previewDoc.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </Box>
            ) : isImageDoc(previewDoc) ? (
              <Box
                style={{
                  width: '100%',
                  minHeight: 350,
                  maxHeight: '75vh',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  padding: 16,
                }}
              >
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    borderRadius: 8,
                    objectFit: 'contain',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </Box>
            ) : (
              <Paper
                p="xl"
                radius="md"
                style={{
                  textAlign: 'center',
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                }}
              >
                <ThemeIcon size={64} radius="xl" color="blue" variant="light" mx="auto" mb="md">
                  {getFileIcon(previewDoc.fileType, previewDoc.name)}
                </ThemeIcon>
                <Text fw={700} size="md" c={isDark ? '#F8FAFC' : '#0F172A'}>
                  {previewDoc.name}
                </Text>
                <Text size="sm" c="dimmed" mt={4} mb="lg">
                  {previewDoc.fileSize || 'Attached'} • Direct in-browser preview is not supported for this file format. You can download or open in a new tab.
                </Text>
                <Group justify="center" gap="sm">
                  <Button
                    color="teal"
                    leftSection={<IconDownload size={14} />}
                    onClick={() => previewDoc && handleDownloadOrOpenDoc(previewDoc)}
                  >
                    Download Document
                  </Button>
                  {previewDoc.url && !previewDoc.url.startsWith('data:') && (
                    <Button
                      variant="default"
                      leftSection={<IconExternalLink size={14} />}
                      onClick={() => window.open(previewDoc.url, '_blank')}
                    >
                      Open Link
                    </Button>
                  )}
                </Group>
              </Paper>
            )
          )}
        </Stack>
      </Modal>
    </Box>
  );
};

export default LeadHandoverSection;
