import * as contactService from '../services/contact.service.js';

/**
 * 1. List contacts with search, filters, pagination, and sorting
 * GET /api/contacts
 */
export async function getContacts(req, res) {
  try {
    const result = await contactService.getContactsService(req.query);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[getContacts Error]:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Get Single Contact by ID
 * GET /api/contacts/:id
 */
export async function getContactById(req, res) {
  try {
    const result = await contactService.getContactByIdService(req.params.id);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Get Contact KPI Stats
 * GET /api/contacts/stats
 */
export async function getContactStats(_req, res) {
  try {
    const result = await contactService.getContactStatsService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Get Contact Dropdown Metadata
 * GET /api/contacts/metadata
 */
export async function getContactMetadata(_req, res) {
  try {
    const result = await contactService.getContactMetadataService();
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Create Contact
 * POST /api/contacts
 */
export async function createContact(req, res) {
  try {
    const result = await contactService.createContactService(req.body, req.user);
    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[createContact Error]:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Update Contact
 * PUT /api/contacts/:id
 */
export async function updateContact(req, res) {
  try {
    const result = await contactService.updateContactService(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 7. Assign Contact
 * PUT /api/contacts/:id/assign
 */
export async function assignContact(req, res) {
  try {
    const result = await contactService.assignContactService(req.params.id, req.body, req.user);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

/**
 * 8. Delete Contact
 * DELETE /api/contacts/:id
 */
export async function deleteContact(req, res) {
  try {
    const result = await contactService.deleteContactService(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export default {
  getContacts,
  getContactById,
  getContactStats,
  getContactMetadata,
  createContact,
  updateContact,
  assignContact,
  deleteContact,
};
