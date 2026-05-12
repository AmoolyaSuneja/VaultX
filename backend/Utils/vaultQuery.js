const Vault = require('../models/vault');

const PARTICIPANT_FIELDS = 'name email';

function populateVaultParticipants(query) {
  return query
    .populate('owner', PARTICIPANT_FIELDS)
    .populate('secondApprover', PARTICIPANT_FIELDS);
}

function findVaultById(id) {
  return populateVaultParticipants(Vault.findById(id));
}

function findVaultByIdWithRequester(id) {
  return populateVaultParticipants(Vault.findById(id)).populate('dualAccess.requestedBy', PARTICIPANT_FIELDS);
}

module.exports = {
  PARTICIPANT_FIELDS,
  populateVaultParticipants,
  findVaultById,
  findVaultByIdWithRequester
};
