const FIELD = Object.freeze({
  applicantIdentity: 'applicantIdentity',
  targetItcode: 'targetItcode',
  targetUser: 'targetUser',
  accountPassword: 'accountPassword',
  confirmAccountPassword: 'confirmAccountPassword',
  relatedAccount: 'relatedAccount',
  mobile: 'mobile',
  email: 'email',
  applicantManager: 'applicantManager',
  targetManager: 'targetManager',
  businessApprover: 'businessApprover',
  reason: 'reason'
})

export const APPLICATION_INFO_FIELD = FIELD

export const APPLICATION_INFO_SCHEMAS = Object.freeze({
  changeInternal: Object.freeze({
    key: 'change-internal',
    fields: Object.freeze([
      FIELD.applicantIdentity,
      FIELD.targetItcode,
      FIELD.mobile,
      FIELD.email,
      FIELD.applicantManager,
      FIELD.targetManager,
      FIELD.businessApprover,
      FIELD.reason
    ]),
    requiredFields: Object.freeze([FIELD.targetItcode, FIELD.targetManager, FIELD.businessApprover, FIELD.reason])
  }),
  changeExternal: Object.freeze({
    key: 'change-external',
    fields: Object.freeze([
      FIELD.applicantIdentity,
      FIELD.targetUser,
      FIELD.relatedAccount,
      FIELD.mobile,
      FIELD.email,
      FIELD.applicantManager,
      FIELD.businessApprover,
      FIELD.reason
    ]),
    requiredFields: Object.freeze([FIELD.targetUser, FIELD.relatedAccount, FIELD.businessApprover, FIELD.reason])
  }),
  create: Object.freeze({
    key: 'create',
    fields: Object.freeze([
      FIELD.applicantIdentity,
      FIELD.targetUser,
      FIELD.accountPassword,
      FIELD.confirmAccountPassword,
      FIELD.relatedAccount,
      FIELD.mobile,
      FIELD.email,
      FIELD.applicantManager,
      FIELD.businessApprover,
      FIELD.reason
    ]),
    requiredFields: Object.freeze([
      FIELD.targetUser,
      FIELD.accountPassword,
      FIELD.confirmAccountPassword,
      FIELD.relatedAccount,
      FIELD.businessApprover,
      FIELD.reason
    ])
  }),
  statusInternal: Object.freeze({
    key: 'status-internal',
    fields: Object.freeze([
      FIELD.applicantIdentity,
      FIELD.targetItcode,
      FIELD.mobile,
      FIELD.email,
      FIELD.reason
    ]),
    requiredFields: Object.freeze([FIELD.targetItcode, FIELD.reason])
  }),
  statusExternal: Object.freeze({
    key: 'status-external',
    fields: Object.freeze([
      FIELD.applicantIdentity,
      FIELD.targetUser,
      FIELD.relatedAccount,
      FIELD.mobile,
      FIELD.email,
      FIELD.reason
    ]),
    requiredFields: Object.freeze([FIELD.targetUser, FIELD.relatedAccount, FIELD.reason])
  })
})

export function resolveApplicationInfoSchema(type, personType = 'internal') {
  if (type === 'create') return APPLICATION_INFO_SCHEMAS.create
  if (type === 'change') {
    return personType === 'external' ? APPLICATION_INFO_SCHEMAS.changeExternal : APPLICATION_INFO_SCHEMAS.changeInternal
  }
  if (type === 'enable' || type === 'disable') {
    return personType === 'external' ? APPLICATION_INFO_SCHEMAS.statusExternal : APPLICATION_INFO_SCHEMAS.statusInternal
  }
  return null
}

export function schemaHasField(schema, field) {
  return !!schema?.fields.includes(field)
}

export function schemaRequiresField(schema, field) {
  return !!schema?.requiredFields.includes(field)
}
