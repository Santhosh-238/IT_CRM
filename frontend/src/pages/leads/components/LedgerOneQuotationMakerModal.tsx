import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Box,
  Group,
  Stack,
  Text,
  Button,
  ActionIcon,
  Badge,
  Paper,
  TextInput,
  NumberInput,
  Tooltip,
  Divider,
  Loader,
  CopyButton,
  Collapse,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconExternalLink,
  IconRefresh,
  IconMaximize,
  IconMinimize,
  IconX,
  IconDeviceFloppy,
  IconCopy,
  IconCheck,
  IconSparkles,
  IconForms,
  IconUser,
  IconBuilding,
  IconReceipt,
  IconCurrencyRupee,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Lead } from '../../../types/lead';
import { Quotation } from '../../../types/billing';
import { billingService } from '../../../services/billingService';

interface LedgerOneQuotationMakerModalProps {
  opened: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: (savedQuote: Quotation) => void;
  onSwitchToCrmForm: () => void;
}

const LEDGERONE_URL = 'https://oneassist.net.in/ledgerone/api/v1/integrations/quotation-maker/generate';

export const LedgerOneQuotationMakerModal: React.FC<LedgerOneQuotationMakerModalProps> = ({
  opened,
  onClose,
  lead,
  onSuccess,
  onSwitchToCrmForm,
}) => {
  const isDark = useComputedColorScheme('light') === 'dark';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSyncBar, setShowSyncBar] = useState(true);
  const [savingToCrm, setSavingToCrm] = useState(false);

  // Quick CRM Sync Form State
  const [quotationNumber, setQuotationNumber] = useState('');
  const [grandTotal, setGrandTotal] = useState<number | ''>(85000);
  const [itemName, setItemName] = useState(
    lead.category === 'Product'
      ? lead.productList?.[0] || 'IT CRM Software License'
      : lead.serviceList?.[0] || 'Software Implementation & Development'
  );
  const [notes, setNotes] = useState('');

  // Auto-generate temporary sequential quote number
  useEffect(() => {
    if (opened) {
      setIframeLoaded(false);
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      setQuotationNumber(`QUO-${new Date().getFullYear()}-${randomSeq}`);
    }
  }, [opened]);

  // Handle reload iframe
  const handleReloadIframe = () => {
    setIframeLoaded(false);
    if (iframeRef.current) {
      iframeRef.current.src = LEDGERONE_URL;
    }
  };

  // Save Quotation into CRM PostgreSQL Database
  const handleSaveToCrmDb = async () => {
    if (!quotationNumber.trim()) {
      notifications.show({ color: 'red', message: 'Quotation Number is required' });
      return;
    }

    const totalVal = Number(grandTotal) || 0;
    if (totalVal <= 0) {
      notifications.show({ color: 'red', message: 'Total amount must be greater than ₹0' });
      return;
    }

    try {
      setSavingToCrm(true);
      const taxAmount = Number(((totalVal * 18) / 118).toFixed(2));
      const subtotal = Number((totalVal - taxAmount).toFixed(2));

      const payload: Partial<Quotation> = {
        leadId: lead.id,
        contactId: lead.id,
        contactName: lead.name,
        companyName: lead.companyName || lead.profession || '',
        contactEmail: lead.email || '',
        contactPhone: lead.phone || '',
        clientAddress: lead.address || '',
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Draft',
        grandTotal: totalVal,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        paymentTerms: 'Net 30 Days',
        notes: notes || `Generated via Quotation Maker for ${lead.name}`,
        termsConditions: '1. Quotation valid for 30 days from issue.\n2. 50% advance along with confirmed Purchase Order.\n3. Taxes extra as applicable by law.',
        items: [
          {
            itemName: itemName || 'Software Development & Solution',
            itemType: 'Service',
            description: `Deliverables and implementation scope for ${lead.name}`,
            quantity: 1,
            unitPrice: subtotal,
            discount: 0,
            taxRate: 18,
            taxAmount: taxAmount,
            totalAmount: totalVal,
          },
        ],
      };

      const saved = await billingService.createQuotation(payload);
      notifications.show({
        color: 'teal',
        icon: <IconCheck size={18} />,
        title: 'Quotation Saved in CRM',
        message: `Quotation ${saved.quotationNumber || quotationNumber} stored directly in CRM Database!`,
      });

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        title: 'Failed to Save in CRM',
        message: err.message || 'Error persisting quotation to CRM database',
      });
    } finally {
      setSavingToCrm(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen={isFullScreen}
      size={isFullScreen ? '100vw' : '96vw'}
      centered
      yOffset="2vh"
      withCloseButton={false}
      radius={isFullScreen ? 0 : 'xl'}
      padding={0}
      styles={{
        content: {
          height: isFullScreen ? '100vh' : '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderRadius: isFullScreen ? 0 : 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
        },
        body: {
          padding: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER TOOLBAR                                                     */}
      {/* ========================================================================= */}
      <Box
        px="lg"
        py="sm"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {/* Left: Branding & Lead context */}
          <Group gap="sm" align="center">
            <Paper
              p={6}
              radius="md"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSparkles size={20} />
            </Paper>

            <div>
              <Group gap="xs" align="center">
                <Text fw={800} size="15px" style={{ color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  Quotation Maker
                </Text>
                <Badge
                  size="sm"
                  variant="filled"
                  color="blue"
                  radius="sm"
                  style={{ fontWeight: 700, textTransform: 'none' }}
                >
                  LedgerOne Engine
                </Badge>
                <Badge
                  size="sm"
                  variant="light"
                  color="teal"
                  radius="sm"
                  style={{ fontWeight: 700, textTransform: 'none' }}
                >
                  CRM Storage Active
                </Badge>
              </Group>

              <Group gap={8} mt={2}>
                <Text size="12px" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconUser size={12} /> {lead.name}
                </Text>
                {lead.companyName && (
                  <Text size="12px" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    • <IconBuilding size={12} /> {lead.companyName}
                  </Text>
                )}
                {lead.phone && (
                  <Text size="12px" c="dimmed">
                    • {lead.phone}
                  </Text>
                )}
              </Group>
            </div>
          </Group>

          {/* Right: Quick actions */}
          <Group gap="xs" align="center">
            {/* Copy Lead Details Quick Button */}
            <CopyButton
              value={`Customer Name: ${lead.name}\nCompany: ${lead.companyName || ''}\nPhone: ${lead.phone || ''}\nEmail: ${lead.email || ''}\nAddress: ${lead.address || ''}`}
            >
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied to Clipboard!' : 'Copy Lead Details to paste into Quotation'}>
                  <Button
                    size="xs"
                    variant="light"
                    color={copied ? 'teal' : 'gray'}
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={copy}
                    style={{ borderRadius: 8 }}
                  >
                    {copied ? 'Copied' : 'Copy Lead Details'}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>

            {/* Switch to native CRM form */}
            <Tooltip label="Use built-in CRM Quotation modal instead">
              <Button
                size="xs"
                variant="subtle"
                color="indigo"
                leftSection={<IconForms size={14} />}
                onClick={() => {
                  onClose();
                  onSwitchToCrmForm();
                }}
                style={{ borderRadius: 8 }}
              >
                In-App Form
              </Button>
            </Tooltip>

            {/* Toggle CRM Sync Bar */}
            <Button
              size="xs"
              variant={showSyncBar ? 'light' : 'filled'}
              color="indigo"
              leftSection={showSyncBar ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              onClick={() => setShowSyncBar(!showSyncBar)}
              style={{ borderRadius: 8 }}
            >
              {showSyncBar ? 'Hide CRM Save Bar' : 'Save to CRM'}
            </Button>

            {/* Refresh iframe */}
            <Tooltip label="Reload Quotation Maker">
              <ActionIcon variant="light" color="gray" size="sm" radius="md" onClick={handleReloadIframe}>
                <IconRefresh size={15} />
              </ActionIcon>
            </Tooltip>

            {/* Open in new tab */}
            <Tooltip label="Open in external browser window">
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                radius="md"
                component="a"
                href={LEDGERONE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink size={15} />
              </ActionIcon>
            </Tooltip>

            {/* Fullscreen toggle */}
            <Tooltip label={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}>
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                radius="md"
                onClick={() => setIsFullScreen(!isFullScreen)}
              >
                {isFullScreen ? <IconMinimize size={15} /> : <IconMaximize size={15} />}
              </ActionIcon>
            </Tooltip>

            {/* Close */}
            <ActionIcon variant="light" color="red" size="sm" radius="md" onClick={onClose}>
              <IconX size={15} />
            </ActionIcon>
          </Group>
        </Group>

        {/* ======================================================================= */}
        {/* 2. COLLAPSIBLE CRM DATABASE SAVE BAR                                   */}
        {/* ======================================================================= */}
        <Collapse in={showSyncBar}>
          <Box
            mt="xs"
            p="xs"
            style={{
              background: isDark ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF',
              borderRadius: 12,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Group gap="xs" style={{ flex: 1 }} wrap="wrap">
                <TextInput
                  size="xs"
                  label="Quotation #"
                  placeholder="QUO-2026-XXXX"
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.currentTarget.value)}
                  style={{ width: 150 }}
                  radius="md"
                />

                <TextInput
                  size="xs"
                  label="Item / Deliverable Scope"
                  placeholder="e.g. ERP Solution & Deployment"
                  value={itemName}
                  onChange={(e) => setItemName(e.currentTarget.value)}
                  style={{ minWidth: 240, flex: 1 }}
                  radius="md"
                />

                <NumberInput
                  size="xs"
                  label="Grand Total (₹)"
                  placeholder="Total Quote Value"
                  value={grandTotal}
                  onChange={(val) => setGrandTotal(typeof val === 'number' ? val : '')}
                  min={0}
                  step={1000}
                  thousandSeparator=","
                  prefix="₹ "
                  style={{ width: 170 }}
                  radius="md"
                />

                <TextInput
                  size="xs"
                  label="Internal Note"
                  placeholder="Optional reference / notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.currentTarget.value)}
                  style={{ width: 220 }}
                  radius="md"
                />
              </Group>

              <Group gap="xs" align="flex-end" style={{ paddingTop: 18 }}>
                <Button
                  size="xs"
                  color="teal"
                  loading={savingToCrm}
                  leftSection={<IconDeviceFloppy size={14} />}
                  onClick={handleSaveToCrmDb}
                  style={{
                    borderRadius: 10,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  Save into CRM Database
                </Button>
              </Group>
            </Group>
          </Box>
        </Collapse>
      </Box>

      {/* ========================================================================= */}
      {/* 3. EMBEDDED QUOTATION MAKER IFRAME                                        */}
      {/* ========================================================================= */}
      <Box style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {!iframeLoaded && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? '#0F172A' : '#F8FAFC',
              zIndex: 10,
              gap: 12,
            }}
          >
            <Loader size="md" color="indigo" type="dots" />
            <Text size="sm" c="dimmed" fw={600}>
              Loading Quotation Maker ({LEDGERONE_URL})...
            </Text>
          </Box>
        )}

        <iframe
          ref={iframeRef}
          src={LEDGERONE_URL}
          title="Quotation Maker"
          onLoad={() => setIframeLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="clipboard-write; clipboard-read"
        />
      </Box>
    </Modal>
  );
};
