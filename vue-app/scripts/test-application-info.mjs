import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  APPLICATION_INFO_FIELD as FIELD,
  APPLICATION_INFO_SCHEMAS,
  resolveApplicationInfoSchema,
  schemaHasField,
  schemaRequiresField
} from '../src/components/permissions/applicationInfoSchema.js'

const expectedSchemas = {
  changeInternal: {
    fields: [FIELD.applicantIdentity, FIELD.targetItcode, FIELD.mobile, FIELD.email, FIELD.applicantManager, FIELD.targetManager, FIELD.reason],
    required: [FIELD.targetItcode, FIELD.targetManager, FIELD.reason]
  },
  changeExternal: {
    fields: [FIELD.applicantIdentity, FIELD.targetUser, FIELD.relatedAccount, FIELD.mobile, FIELD.email, FIELD.applicantManager, FIELD.reason],
    required: [FIELD.targetUser, FIELD.relatedAccount, FIELD.reason]
  },
  create: {
    fields: [FIELD.applicantIdentity, FIELD.targetUser, FIELD.accountPassword, FIELD.confirmAccountPassword, FIELD.relatedAccount, FIELD.mobile, FIELD.email, FIELD.applicantManager, FIELD.reason],
    required: [FIELD.targetUser, FIELD.accountPassword, FIELD.confirmAccountPassword, FIELD.relatedAccount, FIELD.reason]
  },
  statusInternal: {
    fields: [FIELD.applicantIdentity, FIELD.targetItcode, FIELD.mobile, FIELD.email, FIELD.reason],
    required: [FIELD.targetItcode, FIELD.reason]
  },
  statusExternal: {
    fields: [FIELD.applicantIdentity, FIELD.targetUser, FIELD.relatedAccount, FIELD.mobile, FIELD.email, FIELD.reason],
    required: [FIELD.targetUser, FIELD.relatedAccount, FIELD.reason]
  }
}

for (const key of ['changeInternal', 'changeExternal', 'create']) {
  expectedSchemas[key].fields.splice(-1, 0, FIELD.businessApprover)
  expectedSchemas[key].required.splice(-1, 0, FIELD.businessApprover)
}

Object.entries(expectedSchemas).forEach(([key, expected]) => {
  const schema = APPLICATION_INFO_SCHEMAS[key]
  assert.deepEqual(schema.fields, expected.fields, `${key} 字段及顺序必须与确认表格一致`)
  assert.deepEqual(schema.requiredFields, expected.required, `${key} 必填字段必须与确认表格一致`)
  expected.fields.forEach((field) => assert.equal(schemaHasField(schema, field), true, `${key} 应展示 ${field}`))
  expected.required.forEach((field) => assert.equal(schemaRequiresField(schema, field), true, `${key} 应要求 ${field}`))
})

assert.equal(resolveApplicationInfoSchema('change', 'internal'), APPLICATION_INFO_SCHEMAS.changeInternal)
assert.equal(resolveApplicationInfoSchema('change', 'external'), APPLICATION_INFO_SCHEMAS.changeExternal)
assert.equal(resolveApplicationInfoSchema('create', 'internal'), APPLICATION_INFO_SCHEMAS.create, '创建账号固定使用外部账号字段')
assert.equal(resolveApplicationInfoSchema('enable', 'internal'), APPLICATION_INFO_SCHEMAS.statusInternal)
assert.equal(resolveApplicationInfoSchema('disable', 'internal'), APPLICATION_INFO_SCHEMAS.statusInternal)
assert.equal(resolveApplicationInfoSchema('enable', 'external'), APPLICATION_INFO_SCHEMAS.statusExternal)
assert.equal(resolveApplicationInfoSchema('disable', 'external'), APPLICATION_INFO_SCHEMAS.statusExternal)
assert.equal(resolveApplicationInfoSchema('reset', 'internal'), null, '重置密码不得接入本次五类填写信息 Schema')

const viewSource = await readFile(new URL('../src/views/agent/AgentPermissionsView.vue', import.meta.url), 'utf8')
const infoBlockStart = viewSource.indexOf('class="permission-form-grid application-info-form"')
const infoBlockEnd = viewSource.indexOf('currentStep === 2 && isPasswordResetRequest', infoBlockStart)
const infoBlockSource = viewSource.slice(infoBlockStart, infoBlockEnd)
assert.ok(infoBlockSource.includes('申请人用户名/ITCode') && viewSource.includes('applicantIdentityText'), '申请人用户名与 ITCode 必须合并并自动带出')
assert.equal(infoBlockSource.includes('<span class="field-label required">申请人用户名 <em>必填</em></span>'), false, '填写信息区不得继续展示拆分的申请人用户名字段')
assert.ok(viewSource.includes("schemaRequiresField(schema, APPLICATION_INFO_FIELD.targetManager)"), '内部权限变更必须校验被申请人直线经理')
assert.ok(viewSource.includes('mobile: submittedInfo.mobile') && viewSource.includes('email: submittedInfo.email'), '选填联系方式必须进入申请记录')
assert.ok(viewSource.includes('const submittedInfo = submittedApplicationInfo()'), '提交必须按当前 Schema 清理隐藏字段')
assert.ok(viewSource.includes('v-if="isPasswordResetRequest" class="permission-form-grid password-reset-form"'), '重置密码独立表单必须保持')

console.log('application info schema tests passed')
