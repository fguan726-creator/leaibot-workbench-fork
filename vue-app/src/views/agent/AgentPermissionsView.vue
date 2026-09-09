<template>
  <div v-permission-dialog-footer class="permission-page-vue">
    <ContentPageHeader
      title="权限管理"
      description="按原型链路整理权限申请、审批、角色、用户、组织、数据源、功能和删除备份能力，供 POC 演示真实串联。"
    >
      <template #actions>
        <div class="demo-reset-menu" :class="{ open: demoIdentityMenuOpen }">
          <button type="button" class="ghost-btn demo-reset-trigger" @click="demoIdentityMenuOpen = !demoIdentityMenuOpen">
            重置演示：{{ currentDemoIdentity.label }}
            <span>⌄</span>
          </button>
          <div v-if="demoIdentityMenuOpen" class="demo-reset-options">
            <button
              v-for="identity in demoIdentityOptions"
              :key="identity.key"
              type="button"
              :class="{ active: demoIdentityKey === identity.key }"
              @click="resetDemo(identity.key)"
            >{{ identity.label }}</button>
          </div>
        </div>
        <button type="button" class="primary-btn" @click="openRecordModal">查看记录</button>
      </template>
    </ContentPageHeader>

    <div class="permission-layout">
      <aside class="permission-module-rail" aria-label="权限管理菜单">
        <div class="permission-module-rail-head">
          <div class="permission-module-summary">
            <b>权限模块</b>
            <span>{{ modules.length }} 个入口</span>
          </div>
          <label class="permission-module-search">
            <span class="sr-only">搜索权限入口</span>
            <input v-model.trim="moduleSearchKeyword" type="search" placeholder="搜索入口">
          </label>
        </div>
        <div class="permission-module-groups">
          <section v-for="group in filteredModuleGroups" :key="group.key" class="permission-module-group">
            <div class="permission-module-group-title">
              <span>{{ group.label }}</span>
              <span>{{ group.items.length }}</span>
            </div>
            <div class="permission-module-list">
              <button
                v-for="item in group.items"
                :key="item.key"
                type="button"
                :class="{ active: activeModule === item.key }"
                :aria-current="activeModule === item.key ? 'page' : undefined"
                @click="activeModule = item.key"
              >
                <span class="permission-module-icon" aria-hidden="true" v-html="moduleIcon(item.key)"></span>
                <span class="permission-module-copy">
                  <b>{{ item.label }}</b>
                  <small>{{ item.desc }}</small>
                </span>
                <span v-if="item.key === 'approval' && pendingApprovalCount" class="permission-module-badge">{{ pendingApprovalCount }}</span>
              </button>
            </div>
          </section>
          <p v-if="!filteredModuleGroups.length" class="permission-module-empty">暂无匹配入口</p>
        </div>

        <section class="permission-demo-route" aria-labelledby="permission-demo-route-title">
          <div class="permission-demo-route-head">
            <b id="permission-demo-route-title">本次演示链路</b>
            <div class="permission-demo-route-actions">
              <button v-if="currentDemoApproval" type="button" @click="openCurrentDemoApprovalDetail">查看详情</button>
              <button type="button" @click="resetDemo(demoIdentityKey)">重置</button>
            </div>
          </div>
          <ol v-if="demoApprovalRouteItems.length" class="permission-demo-route-list">
            <li
              v-for="item in demoApprovalRouteItems"
              :key="item.key"
              :class="item.kind === 'step' ? item.state : 'permission-demo-route-fold'"
            >
              <template v-if="item.kind === 'step'">
                <span class="permission-demo-route-dot" aria-hidden="true"></span>
                <div>
                  <b>{{ item.label }}</b>
                  <small>{{ item.description }}</small>
                </div>
              </template>
              <button
                v-else
                type="button"
                :aria-expanded="item.expanded"
                @click="toggleDemoRouteFold(item.direction)"
              >
                <span>{{ item.label }}</span>
                <span aria-hidden="true">{{ item.expanded ? '▴' : '▾' }}</span>
              </button>
            </li>
          </ol>
          <p v-else class="permission-demo-route-empty">暂无进行中的申请</p>
        </section>
      </aside>

      <main class="permission-workspace">
        <section v-if="activeModule === 'apply'" class="permission-card flow-card">
          <SectionHeader title="权限申请" description="从申请类型开始，自动带出审批人和执行路径。">
            <template #meta><span class="status-pill">POC 链路</span></template>
          </SectionHeader>

          <div class="permission-stage-tabs">
            <button
              v-for="(step, index) in applySteps"
              :key="step.key"
              type="button"
              :class="{ active: currentStep === index, locked: !canOpenApplyStep(index) }"
              :disabled="!canOpenApplyStep(index)"
              @click="goToApplyStep(index)"
            >
              {{ step.label }}
            </button>
          </div>

          <div v-if="currentStep === 0" class="permission-step">
            <h3>选择申请类型</h3>
            <p>不同类型会自动匹配审批人和执行路径。</p>
            <div class="permission-type-grid">
              <button
                v-for="type in requestTypes"
                :key="type.key"
                type="button"
                :class="{ active: form.type === type.key }"
                @click="selectRequestType(type.key)"
              >
                <span>{{ type.no }}</span>
                <b>{{ type.label }}</b>
                <em>{{ type.summary }}</em>
                <small>{{ type.route }}</small>
              </button>
            </div>
          </div>

          <div v-else-if="currentStep === 1" class="permission-step">
            <h3>{{ isPasswordResetRequest ? '身份验证' : '填写信息' }}</h3>
            <p>{{ infoStepDescription }}</p>
            <div v-if="isAccountStatusRequest" class="status-apply-type-card inline-status-card">
              <span>{{ selectedType.no }}</span>
              <div>
                <b>{{ selectedType.label }}</b>
                <small>{{ selectedType.summary }}</small>
              </div>
            </div>
            <div v-if="isPasswordResetRequest" class="permission-form-grid password-reset-form">
              <div class="status-apply-type-card inline-status-card full">
                <span>{{ selectedType.no }}</span>
                <div>
                  <b>{{ selectedType.label }}</b>
                  <small>{{ selectedType.summary }}</small>
                </div>
              </div>
              <label>
                <span>申请人</span>
                <input v-model="form.applicant" readonly>
              </label>
              <label>
                <span>申请人 ITCode</span>
                <input v-model="form.itcode" readonly>
              </label>
              <div class="permission-form-field full">
                <span class="field-label required">验证方式 <em>必填</em></span>
                <div class="person-type-switch compact" role="radiogroup" aria-label="验证方式">
                  <button type="button" :class="{ active: passwordReset.mode === 'old-password' }" role="radio" :aria-checked="passwordReset.mode === 'old-password'" @click="setPasswordResetMode('old-password')">
                    <b>旧密码验证</b>
                    <small>记得旧密码时，可直接完成修改。</small>
                  </button>
                  <button type="button" :class="{ active: passwordReset.mode === 'contact' }" role="radio" :aria-checked="passwordReset.mode === 'contact'" @click="setPasswordResetMode('contact')">
                    <b>手机号 / 邮箱验证</b>
                    <small>忘记旧密码时，通过绑定信息校验。</small>
                  </button>
                </div>
              </div>
              <label v-if="passwordReset.mode === 'old-password'">
                <span class="field-label required">旧密码 <em>必填</em></span>
                <input v-model.trim="passwordReset.oldPassword" type="password" :class="{ invalid: passwordReset.errors.oldPassword }" placeholder="请输入当前旧密码" @blur="validatePasswordResetForm">
                <small v-if="passwordReset.errors.oldPassword" class="field-error">{{ passwordReset.errors.oldPassword }}</small>
              </label>
              <template v-else>
                <label>
                  <span>手机号</span>
                  <input v-model.trim="passwordReset.mobile" placeholder="请输入绑定手机号">
                </label>
                <label>
                  <span>邮箱</span>
                  <input v-model.trim="passwordReset.email" placeholder="请输入绑定邮箱">
                  <small v-if="passwordReset.errors.contact" class="field-error">{{ passwordReset.errors.contact }}</small>
                </label>
                <label>
                  <span class="field-label required">验证码 <em>必填</em></span>
                  <input v-model.trim="passwordReset.verifyCode" :class="{ invalid: passwordReset.errors.verifyCode }" placeholder="请输入短信或邮箱验证码" @blur="validatePasswordResetForm">
                  <small v-if="passwordReset.errors.verifyCode" class="field-error">{{ passwordReset.errors.verifyCode }}</small>
                </label>
              </template>
              <label>
                <span class="field-label required">新密码 <em>必填</em></span>
                <input v-model.trim="passwordReset.newPassword" type="password" :class="{ invalid: passwordReset.errors.newPassword }" placeholder="请输入新密码" @blur="validatePasswordResetForm">
                <small v-if="passwordReset.errors.newPassword" class="field-error">{{ passwordReset.errors.newPassword }}</small>
              </label>
              <label>
                <span class="field-label required">确认新密码 <em>必填</em></span>
                <input v-model.trim="passwordReset.confirmPassword" type="password" :class="{ invalid: passwordReset.errors.confirmPassword }" placeholder="请再次输入新密码" @blur="validatePasswordResetForm">
                <small v-if="passwordReset.errors.confirmPassword" class="field-error">{{ passwordReset.errors.confirmPassword }}</small>
              </label>
            </div>
            <div v-else class="permission-form-grid application-info-form" :data-form-variant="applicationInfoSchema?.key">
              <div v-if="!isCreateAccountRequest" class="permission-form-field full">
                <span class="field-label required">人员类型 <em>必填</em></span>
                <div class="person-type-switch" role="radiogroup" aria-label="人员类型">
                  <button
                    v-for="type in personTypes"
                    :key="type.key"
                    type="button"
                    :class="{ active: form.personType === type.key }"
                    role="radio"
                    :aria-checked="form.personType === type.key"
                    @click="selectPersonType(type.key)"
                  >
                    <b>{{ type.label }}</b>
                    <small>{{ type.desc }}</small>
                  </button>
                </div>
              </div>
              <label :data-info-field="APPLICATION_INFO_FIELD.applicantIdentity">
                <span class="field-label">申请人用户名/ITCode <em class="autofill">自动带出</em></span>
                <input :value="applicantIdentityText" readonly aria-label="申请人用户名/ITCode">
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.targetItcode)" :data-info-field="APPLICATION_INFO_FIELD.targetItcode">
                <span class="field-label required">被申请人 ITCode <em>必填</em></span>
                <input
                  v-model.trim="form.targetItcode"
                  :class="{ invalid: formErrors.targetItcode }"
                  placeholder="请输入被申请人 ITCode"
                  @blur="validateInfoForm"
                >
                <small v-if="formErrors.targetItcode" class="field-error">{{ formErrors.targetItcode }}</small>
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.targetUser)" :data-info-field="APPLICATION_INFO_FIELD.targetUser">
                <span class="field-label required">被申请人用户名 <em>必填</em></span>
                <input
                  v-model.trim="form.targetUser"
                  :class="{ invalid: formErrors.targetUser }"
                  placeholder="请输入外部协作人员用户名"
                  @blur="validateInfoForm"
                >
                <small v-if="formErrors.targetUser" class="field-error">{{ formErrors.targetUser }}</small>
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.accountPassword)" :data-info-field="APPLICATION_INFO_FIELD.accountPassword">
                <span class="field-label required">设置密码 <em>必填</em></span>
                <input
                  v-model="form.accountPassword"
                  type="password"
                  autocomplete="new-password"
                  :class="{ invalid: formErrors.accountPassword }"
                  placeholder="请设置初始登录密码"
                  @blur="validateInfoForm"
                >
                <small v-if="formErrors.accountPassword" class="field-error">{{ formErrors.accountPassword }}</small>
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.confirmAccountPassword)" :data-info-field="APPLICATION_INFO_FIELD.confirmAccountPassword">
                <span class="field-label required">确认密码 <em>必填</em></span>
                <input
                  v-model="form.confirmAccountPassword"
                  type="password"
                  autocomplete="new-password"
                  :class="{ invalid: formErrors.confirmAccountPassword }"
                  placeholder="请再次输入初始密码"
                  @blur="validateInfoForm"
                >
                <small v-if="formErrors.confirmAccountPassword" class="field-error">{{ formErrors.confirmAccountPassword }}</small>
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.relatedAccount)" class="relation-account-field" :data-info-field="APPLICATION_INFO_FIELD.relatedAccount">
                <span class="field-label required">关联人 ITCode <em>必填</em></span>
                <input
                  v-model.trim="form.relatedAccount"
                  :class="{ invalid: formErrors.relatedAccount }"
                  placeholder="请输入负责对接的内部员工 ITCode"
                  @blur="validateInfoForm"
                >
                <small v-if="formErrors.relatedAccount" class="field-error">{{ formErrors.relatedAccount }}</small>
                <small v-else class="field-help">用于确认外部协作人员的内部对接关系。</small>
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.mobile)" :data-info-field="APPLICATION_INFO_FIELD.mobile">
                <span class="field-label">被申请人手机号 <em class="optional">选填</em></span>
                <input v-model.trim="form.mobile" placeholder="用于账号开通或审批沟通">
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.email)" class="email-field" :data-info-field="APPLICATION_INFO_FIELD.email">
                <span class="field-label">被申请人邮箱 <em class="optional">选填</em></span>
                <input v-model.trim="form.email" placeholder="name@lenovo.com">
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.applicantManager) && !isExternalApplicant" :data-info-field="APPLICATION_INFO_FIELD.applicantManager">
                <span class="field-label">申请人直线经理 <em class="autofill">自动带出</em></span>
                <input v-model="form.applicantManager" readonly>
              </label>
              <label v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.targetManager)" :data-info-field="APPLICATION_INFO_FIELD.targetManager">
                <span class="field-label required">被申请人直线经理 <em>必填</em></span>
                <input
                  v-model.trim="form.targetManager"
                  :class="{ invalid: formErrors.targetManager }"
                  placeholder="请输入被申请人直线经理 ITCode"
                  @blur="validateInfoForm"
                >
                <small v-if="formErrors.targetManager" class="field-error">{{ formErrors.targetManager }}</small>
              </label>
              <BusinessApproverField v-if="showsApplicationInfoField(APPLICATION_INFO_FIELD.businessApprover)" v-model="form.businessApprover" :error="formErrors.businessApprover" @update:model-value="formErrors.businessApprover = ''" />
              <label class="full" :data-info-field="APPLICATION_INFO_FIELD.reason">
                <span class="field-label required">申请原因 <em>必填</em></span>
                <textarea
                  v-model.trim="form.reason"
                  :class="{ invalid: formErrors.reason }"
                  rows="4"
                  :placeholder="infoReasonPlaceholder"
                  @blur="validateInfoForm"
                ></textarea>
                <small v-if="formErrors.reason" class="field-error">{{ formErrors.reason }}</small>
              </label>
            </div>
          </div>
          <div v-else-if="currentStep === 2 && isPasswordResetRequest" class="permission-step reset-complete-step">
            <h3>重置完成</h3>
            <p>密码已通过身份验证完成修改，本次操作不会进入审批列表。</p>
            <div class="execute-summary reset-complete-summary">
              <b>密码重置成功</b>
              <p>{{ form.applicant }} · {{ form.itcode }} · {{ passwordResetModeLabel }}</p>
              <small>{{ passwordReset.completedAt || '刚刚完成' }}</small>
            </div>
          </div>

          <div v-else-if="currentStep === 2 && hasPermissionScopeStep" class="permission-step">
            <PermissionScopeEditor
              :tenant-options="tenantOptions"
              :selected-tenant-ids="form.tenant"
              :tenant-error="formErrors.tenant"
              :selected-roles="selectedRoles"
              :copied-from-user="copiedFromUser"
              :copied-roles="copiedRoles"
              :copied-data-permissions="copiedDataPermissions"
              :manual-data-permissions="manualDataPermissionDetails"
              @toggle-tenant="toggleApplicationTenant"
              @add-role="openRoleModal"
              @copy-role="openCopyModal"
              @select-data="openDataModal"
              @inspect-role="inspectApplicationRole"
              @remove-role="removeRole"
              @remove-data="removeDataPermission"
            />
          </div>
          <div v-else class="permission-step">
            <h3>审批执行</h3>
            <p>请确认本次申请的审批路径；全部必要审批通过后，权限由系统一次性自动生效。</p>
            <div class="approval-route">
              <div v-for="node in approvalNodes" :key="node.label" :class="{ done: node.done }">
                <span>{{ node.step }}</span>
                <b>{{ node.label }}</b>
                <small>{{ node.owner }}</small>
              </div>
            </div>
            <div class="execute-summary">
              <b>将提交的申请</b>
              <p>{{ executionSummaryText }}</p>
            </div>
          </div>

          <div class="flow-actions">
            <span v-if="applySubmitNotice" class="approval-feedback apply-submit-feedback">{{ applySubmitNotice }}</span>
            <button type="button" class="ghost-btn" :disabled="currentStep === 0" @click="prevStep">上一步</button>
            <button v-if="currentStep < applySteps.length - 1" type="button" class="primary-btn" @click="nextStep">{{ nextButtonText }}</button>
            <button v-else type="button" class="primary-btn" @click="submitApplication">{{ finalButtonText }}</button>
          </div>
        </section>

        <section v-else-if="activeModule === 'approval'" class="permission-card">
          <SectionHeader title="审批列表" description="关联人和审批人的统一入口，先筛选待办，再进入详情完成确认或审批。">
            <template #actions>
              <div class="segmented">
                <button
                  v-for="filter in approvalVisibleFilters"
                  :key="filter"
                  type="button"
                  :class="{ active: approvalSearch.status === filter }"
                  @click="approvalSearch.status = filter"
                >{{ filter }}</button>
              </div>
            </template>
          </SectionHeader>
          <div class="approval-filter-bar">
            <label>
              <span>审批人 ITCode</span>
              <input v-model.trim="approvalSearch.approverItcode" placeholder="输入审批人 ITCode">
            </label>
            <div class="approval-handler-filter">
              <span class="filter-label-row">处理人 <em>可输入处理人 ITCode 搜索并多选</em></span>
              <div class="handler-combobox" :class="{ focused: approvalSearch.handlerFocused }">
                <span v-for="handler in approvalSearch.handlers" :key="handler" class="handler-chip">
                  {{ handler }}
                  <button type="button" title="移除处理人" @click="removeApprovalHandler(handler)">×</button>
                </span>
                <input
                  v-model.trim="approvalSearch.handlerDraft"
                  :placeholder="handlerInputPlaceholder"
                  @focus="approvalSearch.handlerFocused = true"
                  @blur="deferCloseHandlerSuggestions"
                  @keydown.enter.prevent="addApprovalHandler"
                >
                <div v-if="showHandlerSuggestions" class="handler-suggestion-list">
                  <button
                    v-for="option in handlerSuggestions"
                    :key="option"
                    type="button"
                    @mousedown.prevent="selectApprovalHandler(option)"
                  >{{ option }}</button>
                </div>
              </div>
            </div>
            <button type="button" class="ghost-btn" @click="resetApprovalFilters">重置筛选</button>
          </div>
          <div class="permission-table-wrap">
            <table class="permission-table approval-table">
              <thead>
                <tr>
                  <th>单号</th>
                  <th>申请类型</th>
                  <th>申请人</th>
                  <th>申请人 ITCode</th>
                  <th>被申请人</th>
                  <th>被申请人 ITCode</th>
                  <th>变更摘要</th>
                  <th>当前处理人</th>
                  <th>当前节点</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredApprovals" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.type }}</td>
                  <td>{{ row.applicant }}</td>
                  <td>{{ row.applicantItcode }}</td>
                  <td>{{ row.target }}</td>
                  <td>{{ row.targetItcode }}</td>
                  <td>{{ approvalChangeSummaryText(row) }}</td>
                  <td>{{ row.handlers.join('、') }}</td>
                  <td>{{ row.node }}</td>
                  <td><span class="table-status" :class="approvalDisplayStatusKey(row)">{{ approvalDisplayStatus(row) }}</span></td>
                  <td>{{ row.time }}</td>
                  <td>
                    <button v-if="canApproveRow(row)" type="button" class="link-btn success" @click="openApprovalWorkspace(row, 'approve')">审批</button>
                    <button v-else type="button" class="link-btn" @click="openApprovalWorkspace(row, 'view')">查看</button>
                  </td>
                </tr>
                <tr v-if="!filteredApprovals.length">
                  <td colspan="12">
                    <div class="table-empty">
                      <b>没有匹配的审批任务</b>
                      <p>请调整审批人 ITCode、处理人或状态筛选后再查看。</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section v-else-if="activeModule === 'roles'" class="permission-card">
          <SectionHeader title="角色管理" description="按角色组和角色名称快速定位，查看这个角色能做什么、能看什么、影响哪些人。">
            <template #actions><button type="button" class="primary-btn" @click="openRoleEditor('create')">新增角色</button></template>
          </SectionHeader>

          <div class="role-filter-bar role-management-filter-bar">
            <label>
              <span>角色名称</span>
              <input v-model.trim="roleFilters.keyword" placeholder="搜索角色名称">
            </label>
            <label>
              <span>角色组</span>
              <select v-model="roleFilters.group">
                <option value="">全部角色组</option>
                <option v-for="group in roleGroupOptions" :key="group" :value="group">{{ group }}</option>
              </select>
            </label>
            <label>
              <span>敏感度</span>
              <select v-model="roleFilters.sensitivity">
                <option value="">全部敏感度</option>
                <option v-for="option in sensitivityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <button type="button" class="ghost-btn" @click="resetRoleFilters">重置筛选</button>
          </div>

          <div class="role-result-line">
            <span>共 {{ allRoles.length }} 个角色，当前显示 {{ filteredManagedRoles.length }} 个</span>
            <b v-if="roleFilters.keyword || roleFilters.group || roleFilters.sensitivity">已按条件筛选</b>
          </div>

          <div class="permission-table-wrap role-table-wrap">
            <table class="permission-table role-management-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>业务负责人</th>
                  <th>角色组</th>
                  <th>角色名称</th>
                  <th>包含用户数</th>
                  <th>角色描述</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(role, index) in filteredManagedRoles" :key="role.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ role.owner }}</td>
                  <td>{{ role.group }}</td>
                  <td>
                    <div class="role-name-cell">
                      <b>{{ role.name }}</b>
                      <span v-if="role.systemRole" class="table-status pending">内置角色</span>
                    </div>
                  </td>
                  <td>{{ role.users }} 人</td>
                  <td class="role-desc-cell">{{ role.desc }}</td>
                  <td>
                    <div class="row-actions">
                      <button type="button" class="link-btn" @click="openRoleEditor('view', role)">查看</button>
                      <button type="button" class="link-btn" @click="openRoleEditor('edit', role)">编辑</button>
                      <button type="button" class="link-btn danger" @click="openRoleDeleteConfirm(role)">删除</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredManagedRoles.length">
                  <td colspan="7">
                    <div class="table-empty">
                      <b>没有找到匹配的角色</b>
                      <p>请调整角色名称或角色组筛选条件后再试。</p>
                      <button type="button" class="ghost-btn small" @click="resetRoleFilters">重置筛选</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section v-else-if="activeModule === 'users'" class="permission-card">
          <SectionHeader title="用户管理" description="按账号、姓名和 ITCode 绑定状态查找用户，维护基础信息、角色和角色之外的额外权限。">
            <template #actions><button type="button" class="primary-btn" @click="openUserWorkspace('create')">新增用户</button></template>
          </SectionHeader>

          <div class="admin-cleanup-panel">
            <div>
              <b>admin 权限清理提醒</b>
              <p>规则：超过 3 个月未成功登录 admin，将自动清理角色、额外数据权限和自定义数据授权；清理前 1 天自动发送邮件提醒。</p>
              <small>当前演示日期：{{ adminCleanupRunDate }}；按用户最近一次成功 admin 登录时间分别计算到期日。</small>
            </div>
            <div class="admin-cleanup-actions">
              <span class="table-status pending">提醒 {{ adminCleanupReminderCount }} 个</span>
              <span :class="['table-status', adminCleanupCandidates.length ? 'pending' : 'done']">清理 {{ adminCleanupCandidates.length }} 个</span>
              <span class="table-status done">自动巡检</span>
            </div>
          </div>
          <div v-if="adminCleanupNotice" class="admin-cleanup-notice">{{ adminCleanupNotice }}</div>



          <div class="user-filter-bar">
            <label>
              <span>用户账号</span>
              <input v-model.trim="userFilters.account" placeholder="搜索用户账号或登录账号">
            </label>
            <label>
              <span>用户姓名</span>
              <input v-model.trim="userFilters.name" placeholder="搜索用户姓名">
            </label>
            <label>
              <span>是否绑定 IT code</span>
              <select v-model="userFilters.bindItcode">
                <option value="">全部</option>
                <option value="yes">已绑定</option>
                <option value="no">未绑定</option>
              </select>
            </label>
            <button type="button" class="ghost-btn" @click="resetUserFilters">重置筛选</button>
          </div>

          <div class="role-result-line">
            <span>共 {{ users.length }} 个用户，当前显示 {{ filteredUsers.length }} 个</span>
            <b v-if="hasUserFilters">已按条件筛选</b>
          </div>

          <div class="permission-table-wrap role-table-wrap">
            <table class="permission-table user-management-table">
              <thead>
                <tr>
                  <th>登录账号</th>
                  <th>用户姓名</th>
                  <th>有效期</th>
                  <th>最近 admin 登录</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.userAccount">
                  <td>
                    <div class="user-account-cell">
                      <b>{{ user.loginAccount }}</b>
                      <small>{{ user.userAccount }} · {{ user.bindItcode ? '已绑定 IT code' : '未绑定 IT code' }}</small>
                    </div>
                  </td>
                  <td>{{ user.name }}</td>
                  <td>{{ user.validUntil }}</td>
                  <td>
                    <div class="admin-login-cell">
                      <b>{{ lastAdminLoginText(user) }}</b>
                      <button
                        v-if="adminCleanupMailSent(user)"
                        type="button"
                        class="admin-cleanup-mail-link"
                        @click="openAdminCleanupEmailPreview(user)"
                      >
                        {{ adminCleanupRiskText(user) }}
                      </button>
                      <small v-else-if="adminCleanupRiskText(user)">{{ adminCleanupRiskText(user) }}</small>
                    </div>
                  </td>
                  <td><span class="table-status" :class="user.statusKey">{{ userStatusLabel(user) }}</span></td>
                  <td>
                    <div class="row-actions">
                      <button type="button" class="link-btn" @click="openUserWorkspace('edit', user)">编辑</button>
                      <button type="button" :class="['link-btn', user.status === 'enabled' ? 'danger' : 'success']" @click="openUserStatusConfirm(user)">{{ user.status === 'enabled' ? '禁用' : '启用' }}</button>
                      <button type="button" class="link-btn" @click="openUserWorkspace('view', user)">详情</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!filteredUsers.length">
                  <td colspan="6">
                    <div class="table-empty">
                      <b>没有找到匹配的用户</b>
                      <p>请调整用户账号、用户姓名或 ITCode 绑定状态后再查看。</p>
                      <button type="button" class="ghost-btn small" @click="resetUserFilters">重置筛选</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section v-else-if="activeModule === 'orgs'" class="permission-card org-workspace-card">
          <SectionHeader title="组织管理" description="维护权限体系中的基础组织对象，用于角色归属、用户成员、数据范围和功能范围的统一引用。">
            <template #actions>
              <div class="org-title-actions">
                <button type="button" class="primary-btn" @click="openOrganizationEditor('create')">新增组织</button>
              </div>
            </template>
          </SectionHeader>



          <div class="org-workspace-layout">
            <aside class="org-tree-panel">
              <div class="org-panel-head">
                <div>
                  <b>组织架构</b>
                  <small>点击节点查看详情和成员</small>
                </div>
              </div>
              <div class="org-search-box">
                <input v-model.trim="organizationSearchKeyword" placeholder="搜索组织名称、编码、负责人">
                <button v-if="organizationSearchKeyword" type="button" class="link-btn" @click="organizationSearchKeyword = ''">清空</button>
              </div>
              <div v-if="organizationSearchKeyword" class="org-chart-search-results">
                <span>搜索结果</span>
                <button
                  v-for="org in orgChartSearchResults"
                  :key="org.id"
                  type="button"
                  :class="{ active: selectedOrganizationId === org.id }"
                  @click="selectOrganization(org.id)"
                >{{ org.name }} · {{ org.code }}</button>
                <small v-if="!orgChartSearchResults.length">没有找到匹配组织</small>
              </div>
              <div v-if="selectedOrganization" class="org-chart-canvas">
                <div v-if="selectedOrganizationParent" class="org-chart-tier parent-tier">
                  <article class="org-chart-card parent-card">
                    <button type="button" class="org-chart-focus" @click="selectOrganization(selectedOrganizationParent.id)">
                      <span>上级组织</span>
                      <b>{{ selectedOrganizationParent.name }}</b>
                      <small>{{ selectedOrganizationParent.owner || '未配置负责人' }} · {{ selectedOrganizationParent.code }}</small>
                    </button>
                    <button type="button" class="org-chart-detail-btn" @click="openOrganizationDetail(selectedOrganizationParent.id)">详情</button>
                  </article>
                </div>
                <div v-if="selectedOrganizationParent" class="org-chart-link parent-link"><i></i></div>
                <div class="org-chart-tier current-tier">
                  <article class="org-chart-card current-card active">
                    <button type="button" class="org-chart-focus" @click="selectOrganization(selectedOrganization.id)">
                      <span>{{ selectedOrganization.code }}</span>
                      <b>{{ selectedOrganization.name }}</b>
                      <small>{{ selectedOrganization.owner || '未配置负责人' }} · {{ selectedOrganization.memberCount }} 人</small>
                    </button>
                    <button type="button" class="org-chart-detail-btn" @click="openOrganizationDetail(selectedOrganization.id)">详情</button>
                  </article>
                </div>
                <div class="org-chart-link child-link" :class="{ hidden: !selectedOrganizationChildren.length }"><i></i></div>
                <div class="org-chart-tier child-tier">
                  <article
                    v-for="child in selectedOrganizationChildren"
                    :key="child.id"
                    class="org-chart-card child-card"
                  >
                    <button type="button" class="org-chart-focus" @click="selectOrganization(child.id)">
                      <span>{{ child.code }}</span>
                      <b>{{ child.name }}</b>
                      <small>{{ child.owner || '未配置负责人' }} · {{ child.memberCount }} 人</small>
                    </button>
                    <button type="button" class="org-chart-detail-btn" @click="openOrganizationDetail(child.id)">详情</button>
                  </article>
                  <button type="button" class="org-chart-card add-card" @click="openOrganizationChildEditor(selectedOrganization.id)">
                    <b>+</b>
                    <small>新增下级组织</small>
                  </button>
                </div>
              </div>
              <div v-if="organizationNotice" class="approval-feedback org-feedback org-chart-feedback">
                <span>{{ organizationNotice }}</span>
                <button type="button" aria-label="关闭提示" @click="dismissOrganizationNotice">×</button>
              </div>
            </aside>


          </div>
        </section>


        <section v-else-if="activeModule === 'functions'" class="permission-card function-workspace-card">
          <SectionHeader title="菜单管理" description="维护菜单下的功能、按钮和 Skill 能力，并明确每项能力关联的后台接口。">
            <template #actions>
              <div class="section-actions function-section-actions">
                <button type="button" class="primary-btn" @click="openFunctionCreateModal('function')">新增</button>
              </div>
            </template>
          </SectionHeader>
          <div class="function-filter-bar">
            <label>
              <span>名称</span>
              <input v-model.trim="functionFilters.name" placeholder="搜索功能名称">
            </label>
            <label>
              <span>所属目录</span>
              <select v-model="functionFilters.root" @change="syncFunctionMenuFilter">
                <option value="">全部目录</option>
                <option v-for="root in functionRootOptions" :key="root" :value="root">{{ root }}</option>
              </select>
            </label>
            <label>
              <span>所属页面</span>
              <select v-model="functionFilters.menu">
                <option value="">全部页面</option>
                <option v-for="menu in functionSecondMenuOptions" :key="menu" :value="menu">{{ menu }}</option>
              </select>
            </label>
            <label>
              <span>类型</span>
              <select v-model="functionFilters.type">
                <option value="">全部类型</option>
                <option v-for="type in functionTypeOptions" :key="type.value" :value="type.value">{{ type.label }}</option>
              </select>
            </label>
            <button type="button" class="ghost-btn" @click="resetFunctionFilters">重置筛选</button>
          </div>

          <div class="role-result-line function-result-line">
            <span>共 {{ functionCatalogRows.length }} 项权限对象，当前显示 {{ filteredManagedFunctions.length }} 项</span>
            <b v-if="hasFunctionFilters">已按条件筛选</b>
          </div>

          <div :class="['function-workspace-layout', { 'detail-collapsed': !functionDetailVisible }]">
            <div class="permission-table-wrap function-table-wrap">
              <table v-if="filteredManagedFunctions.length" class="permission-table function-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>类型</th>
                    <th>描述</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in filteredManagedFunctions"
                    :key="item.id"
                    :class="['function-tree-row', item.itemKind, { active: selectedManagedFunction?.id === item.id }]"
                    @click="selectManagedFunction(item.id)"
                  >
                    <td>
                      <div :class="['function-name-cell', 'function-tree-name', { nested: item.depth > 0 }]" :style="{ '--tree-depth': item.depth }">
                        <button
                          v-if="item.hasChildren"
                          type="button"
                          :class="['function-tree-toggle', { expanded: isFunctionTreeExpanded(item) }]"
                          :aria-label="isFunctionTreeExpanded(item) ? '收起' : '展开'"
                          @click.stop="toggleFunctionTreeRow(item)"
                        >›</button>
                        <span v-else class="function-tree-spacer"></span>
                        <div class="function-tree-copy">
                          <div class="function-tree-title">
                            <b>{{ item.name }}</b>
                            <span v-if="item.itemKind === 'directory'" class="function-tree-count">{{ functionTreeChildCount(item) }} 项</span>
                          </div>
                          <small v-if="item.itemKind !== 'directory'">{{ item.menu }}</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="function-type-badge">{{ functionTypeLabel(item.type) }}</span></td>
                    <td class="function-desc-cell">{{ item.description }}</td>
                    <td>
                      <div class="row-actions" @click.stop>
                        <button type="button" class="link-btn" @click="openFunctionDetail(item)">详情</button>
                        <button v-if="item.itemKind === 'directory' || item.itemKind === 'menu'" type="button" class="link-btn" @click="openFunctionStructureEditor(item)">编辑</button>
                        <button v-if="item.itemKind === 'function'" type="button" class="link-btn" @click="openFunctionEditor('edit', item)">编辑</button>
                        <button v-if="item.itemKind === 'function'" type="button" class="link-btn danger" @click="deleteManagedFunctionFromRow(item)">删除</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="table-empty function-empty">
                <b>没有找到匹配的权限对象</b>
                <p>请调整名称、目录、页面或类型后再查看。</p>
                <button type="button" class="ghost-btn small" @click="resetFunctionFilters">重置筛选</button>
              </div>
            </div>

            <aside v-if="functionDetailVisible && selectedManagedFunction" class="function-detail-panel">
              <div class="function-detail-head">
                <div>
                  <h3>{{ selectedManagedFunction.name }}</h3>
                  <p>{{ selectedManagedFunction.description }}</p>
                </div>
                <div class="function-detail-actions">
                  <button v-if="selectedManagedFunction.itemKind === 'directory' || selectedManagedFunction.itemKind === 'menu'" type="button" class="ghost-btn small" @click="openFunctionStructureEditor(selectedManagedFunction)">编辑</button>
                  <button v-if="selectedManagedFunction.itemKind === 'function'" type="button" class="ghost-btn small" @click="openFunctionEditor('edit', selectedManagedFunction)">编辑</button>
                  <button v-if="selectedManagedFunction.itemKind === 'function'" type="button" class="danger-outline-btn small" @click="deleteSelectedManagedFunction">删除</button>
                  <button type="button" class="ghost-btn small" @click="closeFunctionDetail">关闭</button>
                </div>
              </div>
              <dl class="function-detail-grid">
                <div><dt>所属目录</dt><dd>{{ functionMenuParts(selectedManagedFunction.menu).root || '-' }}</dd></div>
                <div><dt>所属页面</dt><dd>{{ functionMenuParts(selectedManagedFunction.menu).leaf || functionMenuParts(selectedManagedFunction.menu).second || '-' }}</dd></div>
                <div class="full"><dt>完整路径</dt><dd>{{ selectedManagedFunction.menu }}</dd></div>
                <div><dt>对象名称</dt><dd>{{ selectedManagedFunction.name }}</dd></div>
                <div><dt>类型</dt><dd>{{ functionTypeLabel(selectedManagedFunction.type) }}</dd></div>
                <div class="full"><dt>描述</dt><dd>{{ selectedManagedFunction.description }}</dd></div>
              </dl>

              <div class="function-detail-block">
                <b>关联接口</b>
                <div v-if="selectedManagedFunction.itemKind === 'function' && selectedManagedFunction.interfaces.length" class="function-api-list">
                  <article v-for="api in selectedManagedFunction.interfaces" :key="api.id">
                    <span>{{ api.name }}</span>
                    <code>{{ api.url }}</code>
                  </article>
                </div>
                <p v-else-if="selectedManagedFunction.itemKind === 'function'" class="function-muted">当前功能还没有关联接口。</p>
                <p v-else class="function-muted">目录和菜单不直接关联接口，接口在具体功能里维护。</p>
              </div>
            </aside>
          </div>

          <div v-if="functionNotice" class="approval-feedback function-feedback">
            <span>{{ functionNotice }}</span>
            <button type="button" aria-label="关闭提示" @click="dismissFunctionNotice">×</button>
          </div>
        </section>
        <section v-else-if="activeModule === 'datasource'" class="permission-card datasource-workspace-card">
          <SectionHeader title="数据源管理" description="维护数据权限的基础对象，按左侧导航目录、页面、接口地址和权限参数管理可授权范围。">
            <template #actions><button type="button" class="primary-btn" @click="openDataSourceEditor('create')">新增数据源</button></template>
          </SectionHeader>

          <div class="datasource-filter-bar compact">
            <label>
              <span>所属目录/页面</span>
              <select v-model="dataSourceFilters.menu">
                <option value="">全部目录/页面</option>
                <option v-for="option in dataSourceMenuFilterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label>
              <span>名称</span>
              <input v-model.trim="dataSourceFilters.name" placeholder="输入名称搜索">
            </label>
            <label>
              <span>敏感性</span>
              <select v-model="dataSourceFilters.sensitivity">
                <option value="">全部敏感性</option>
                <option v-for="option in dataSourceSensitivityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <button type="button" class="ghost-btn" @click="resetDataSourceFilters">重置筛选</button>
          </div>

          <div class="role-result-line datasource-result-line">
            <span>共 {{ dataSources.length }} 个数据源，当前显示 {{ filteredDataSources.length }} 个</span>
            <b v-if="hasDataSourceFilters">已按条件筛选</b>
          </div>

          <div :class="['datasource-workspace-layout', { 'detail-collapsed': !dataSourceDetailVisible }]">
            <div class="permission-table-wrap datasource-table-wrap flat">
              <table v-if="filteredDataSourceRows.length" class="permission-table datasource-table datasource-tree-table flat">
                <thead>
                  <tr>
                    <th>目录 / 页面 / 数据源</th>
                    <th>类型</th>
                    <th>接口地址</th>
                    <th>权限参数</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in filteredDataSourceRows" :key="row.id" :class="['datasource-tree-row', row.itemKind, { active: selectedDataSource?.id === row.sourceId } ]" @click="handleDataSourceRowClick(row)">
                    <td>
                      <div :class="['function-name-cell', 'function-tree-name', 'datasource-tree-name', { nested: row.depth > 0 }]" :style="{ '--tree-depth': row.depth }">
                        <button
                          v-if="row.hasChildren"
                          type="button"
                          :class="['function-tree-toggle', { expanded: isDataSourceTreeExpanded(row) }]"
                          :aria-label="isDataSourceTreeExpanded(row) ? '收起' : '展开'"
                          @click.stop="toggleDataSourceTreeRow(row)"
                        >›</button>
                        <span v-else class="function-tree-spacer"></span>
                        <div class="function-tree-copy">
                          <div class="function-tree-title">
                            <b>{{ row.name }}</b>
                            <span v-if="row.itemKind === 'directory'" class="function-tree-count">{{ dataSourceTreeChildCount(row) }} 项</span>
                          </div>
                          <small v-if="row.itemKind === 'source'">{{ dataSourceMenuPath(row) }}</small>
                        </div>
                      </div>
                    </td>
                    <td><span :class="['function-type-badge', 'datasource-tree-type', row.itemKind]">{{ dataSourceTreeTypeLabel(row) }}</span></td>
                    <td class="datasource-url-cell">{{ row.itemKind === 'source' ? row.apiUrl : '-' }}</td>
                    <td>{{ row.itemKind === 'source' ? row.permissionParam : '-' }}</td>
                    <td>
                      <div v-if="row.itemKind === 'source'" class="row-actions">
                        <button type="button" class="link-btn" @click.stop="openDataSourceEditor('edit', row)">编辑</button>
                        <button type="button" class="link-btn danger" @click.stop="deleteDataSource(row)">删除</button>
                        <button type="button" class="link-btn" @click.stop="openDataSourceDetail(row)">详情</button>
                      </div>
                      <span v-else class="datasource-structure-note">承载数据源</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="table-empty datasource-empty">
                <b>没有找到匹配的数据源</b>
                <p>请调整目录/页面、名称或敏感性后再查看。</p>
                <button type="button" class="ghost-btn small" @click="resetDataSourceFilters">重置筛选</button>
              </div>
            </div>

            <aside v-if="dataSourceDetailVisible && selectedDataSource" class="datasource-detail-panel datasource-drawer-panel">
              <div class="datasource-detail-head">
                <div>
                  <span>{{ dataSourceMenuPath(selectedDataSource) }}</span>
                  <h3>{{ selectedDataSource.name }}</h3>
                  <p>{{ selectedDataSource.remark || '暂无备注，请补充该数据源的授权场景和使用边界。' }}</p>
                </div>
                <div class="function-detail-actions">
                  <button type="button" class="ghost-btn small" @click="openDataSourceEditor('edit', selectedDataSource)">编辑</button>
                  <button type="button" class="danger-outline-btn small" @click="deleteDataSource(selectedDataSource)">删除</button>
                  <button type="button" class="ghost-btn small" @click="closeDataSourceDetail">关闭</button>
                </div>
              </div>
              <div class="datasource-detail-scroll">
                <dl class="datasource-detail-grid">
                  <div class="full"><dt>所属目录/页面</dt><dd>{{ dataSourceMenuPath(selectedDataSource) }}</dd></div>
                  <div><dt>数据源名称</dt><dd>{{ selectedDataSource.name }}</dd></div>
                  <div><dt>敏感性</dt><dd><span :class="['datasource-badge', sensitivityRisk(selectedDataSource.sensitivity)]">{{ dataSourceSensitivityLabel(selectedDataSource.sensitivity) }}</span></dd></div>
                  <div class="full"><dt>接口地址</dt><dd>{{ selectedDataSource.apiUrl }}</dd></div>
                  <div><dt>权限参数</dt><dd>{{ selectedDataSource.permissionParam }}</dd></div>
                  <div><dt>key / value</dt><dd>{{ selectedDataSource.key || '未配置' }} / {{ selectedDataSource.value || '未配置' }}</dd></div>
                  <div class="full"><dt>备注</dt><dd>{{ selectedDataSource.remark || '无' }}</dd></div>
                </dl>
              </div>
            </aside>
          </div>

          <div v-if="dataSourceNotice" class="approval-feedback datasource-feedback">
            <span>{{ dataSourceNotice }}</span>
            <button type="button" aria-label="关闭提示" @click="dismissDataSourceNotice">×</button>
          </div>
        </section>

        <section v-else class="permission-card">
          <SectionHeader :title="currentModule.label" :description="currentModule.fullDesc">
            <template #actions><button type="button" class="primary-btn" @click="openEntityModal(`新增${currentModule.label}`, genericTemplate)">新增</button></template>
          </SectionHeader>
          <div class="permission-grid-list compact">
            <article v-for="item in currentModule.items" :key="item.name">
              <span>{{ item.code }}</span>
              <h3>{{ item.name }}</h3>
              <p>{{ item.desc }}</p>
              <div class="meta-row">
                <b>{{ item.status }}</b>
                <small>{{ item.owner }}</small>
              </div>
              <button type="button" class="ghost-btn small" @click="openEntityModal(`${currentModule.label}详情`, item)">查看</button>
            </article>
          </div>
        </section>
      </main>
    </div>

    <div v-if="picker.visible" class="permission-modal" @click.self="closePicker">
      <div class="modal-panel small">
        <button type="button" class="modal-close" @click="closePicker">×</button>
        <h3>{{ picker.title }}</h3>
        <p>选择后会回写到当前申请。</p>
        <div class="picker-list">
          <button v-for="item in picker.options" :key="item" type="button" @click="choosePicker(item)">
            {{ item }}
          </button>
        </div>
      </div>
    </div>

    <PermissionRolePickerModal
      :class="{ 'permission-scope-submodal-layer': approvalWorkspace.visible }"
      :visible="roleModal.visible"
      :roles="filteredRoleOptions"
      :detail-role="roleModalDetailRole"
      :permission-groups="filteredRolePermissionGroups(roleModalDetailRole, roleModal.activePermissionTab, roleModal.detailKeyword)"
      :keyword="roleModal.keyword"
      :detail-keyword="roleModal.detailKeyword"
      :active-permission-tab="roleModal.activePermissionTab"
      :selected-role-ids="roleModal.selectedIds"
      :selected-function-ids="roleModal.selectedFunctionIds"
      :selected-data-ids="roleModal.selectedDataIds"
      :locked-role-ids="copiedRoleIds"
      :conflicts="roleModalCandidateConflicts"
      @close="closeRoleModal"
      @confirm="confirmRoleSelection"
      @open-detail="openRoleDetail"
      @close-detail="closeRoleDetail"
      @toggle-role="toggleTempRole"
      @toggle-function="toggleRoleModalFunctionPermission"
      @toggle-data="toggleRoleModalDataPermission"
      @update:keyword="roleModal.keyword = $event; syncRoleModalDetailWithResults()"
      @update:detail-keyword="roleModal.detailKeyword = $event"
      @update:active-permission-tab="roleModal.activePermissionTab = $event"
    />
    <div v-if="roleCardDetail.visible && roleCardDetailRole" class="permission-modal permission-detail-layer" @click.self="closeRoleCardDetail">
      <div class="modal-panel role-card-detail-modal">
        <button type="button" class="modal-close" @click="closeRoleCardDetail">×</button>
        <span class="drawer-eyebrow">角色权限详情</span>
        <h3>{{ roleCardDetailRole.name }}</h3>
        <p class="modal-note">{{ roleCardDetailRole.desc }}</p>
        <div class="role-permission-overview">
          <div class="role-permission-tabs" role="tablist" aria-label="角色权限类型">
            <button type="button" :class="{ active: roleCardDetail.activePermissionTab === 'function' }" @click="roleCardDetail.activePermissionTab = 'function'">功能权限 <b>{{ rolePermissionTabCount(roleCardDetailRole, 'function') }}</b></button>
            <button type="button" :class="{ active: roleCardDetail.activePermissionTab === 'data' }" @click="roleCardDetail.activePermissionTab = 'data'">数据权限 <b>{{ rolePermissionTabCount(roleCardDetailRole, 'data') }}</b></button>
          </div>
          <input v-if="roleCardDetail.activePermissionTab === 'function'" v-model.trim="roleCardDetail.keyword" class="modal-search-input drawer-search" placeholder="搜索功能权限名称、说明或分类">
        </div>
        <div v-if="roleCardDetail.activePermissionTab === 'function'" class="role-permission-tree card-permission-tree categorized-permission-tree">
          <details v-for="root in filteredRolePermissionGroups(roleCardDetailRole, 'function', roleCardDetail.keyword)" :key="root.id" class="permission-tree-root" open>
            <summary><b>{{ root.name }}</b><span>{{ rolePermissionGroupLabel(root, 'function') }}</span></summary>
            <div class="permission-tree-branch-list">
              <details v-for="branch in root.children" :key="branch.id" class="permission-tree-branch" open>
                <summary><b>{{ branch.name }}</b><span>{{ rolePermissionBranchLabel(branch, 'function') }}</span></summary>
                <div class="permission-item-list">
                  <label v-for="permission in rolePermissionBranchItems(branch, 'function')" :key="permission.id" class="permission-detail-check">
                    <input type="checkbox" :disabled="roleCardPermissionCheckboxDisabled()" :checked="isRoleCardFunctionSelected(permission.id)" @change="toggleRoleCardFunctionPermission(permission.id)">
                    <span><b>{{ permission.name }}</b><small>{{ permission.description || permission.scope || permission.id }}</small></span>
                  </label>
                </div>
              </details>
            </div>
          </details>
          <div v-if="!filteredRolePermissionGroups(roleCardDetailRole, 'function', roleCardDetail.keyword).length" class="scope-empty compact-empty inline-empty"><b>没有匹配的功能权限</b><p>请调整搜索关键词。</p></div>
        </div>
        <div v-else class="role-permission-tree card-permission-tree data-directory-tree">
          <PermissionDataDirectoryList
            :directories="filteredRolePermissionGroups(roleCardDetailRole, 'data')"
            :selected-ids="roleCardSelectedDataIds"
            :disabled="roleCardDataCheckboxDisabled()"
            @toggle="toggleRoleCardDataPermission"
          />
        </div>
        <div class="modal-actions">
          <button type="button" class="primary-btn" @click="closeRoleCardDetail">知道了</button>
        </div>
      </div>
    </div>
    <PermissionCopyRoleModal
      :class="{ 'permission-scope-submodal-layer': approvalWorkspace.visible }"
      :visible="copyModal.visible"
      :itcode="copyModal.itcode"
      :error="copyModal.error"
      @close="closeCopyModal"
      @confirm="confirmCopyPermissions"
      @update:itcode="copyModal.itcode = $event; copyModal.error = ''"
    />

    <PermissionDataPickerModal
      :class="{ 'permission-scope-submodal-layer': approvalWorkspace.visible }"
      :visible="dataModal.visible"
      :directories="dataPermissionDirectories"
      :selected-ids="dataModal.selectedIds"
      :locked-ids="Object.keys(copiedDataSourceMap)"
      :locked-labels="copiedDataSourceMap"
      @close="closeDataModal"
      @confirm="confirmDataSelection"
      @toggle="toggleTempDataPermission"
    />

    <div v-if="functionMenuEditor.visible" class="permission-modal" @click.self="closeFunctionMenuEditor">
      <div class="modal-panel function-menu-editor-modal function-create-modal">
        <button type="button" class="modal-close" @click="closeFunctionMenuEditor">×</button>
        <h3>{{ functionMenuEditor.mode === 'edit' ? (functionCreateTab === 'directory' ? '编辑目录' : '编辑菜单') : '新增' }}</h3>
        <p class="modal-note">{{ functionMenuEditor.mode === 'edit' ? '编辑后会同步更新列表结构和相关功能的完整路径。' : '按“目录 / 菜单（页面） / 功能”的层级维护权限对象，当前为本地 POC 状态。' }}</p>
        <div v-if="functionMenuEditor.mode === 'create'" class="role-editor-tabs function-create-tabs" role="tablist" aria-label="菜单管理新增类型">
          <button type="button" :class="{ active: functionCreateTab === 'directory' }" @click="switchFunctionCreateTab('directory')">新增目录</button>
          <button type="button" :class="{ active: functionCreateTab === 'menu' }" @click="switchFunctionCreateTab('menu')">新增菜单</button>
          <button type="button" :class="{ active: functionCreateTab === 'function' }" @click="switchFunctionCreateTab('function')">新增功能</button>
        </div>

        <section v-if="functionCreateTab === 'directory'" class="function-create-section">
          <div class="permission-form-grid function-editor-form">
            <label>
              <span class="field-label required">上级目录 <em>必填</em></span>
              <select v-model="functionDirectoryEditor.draft.parentId" :class="{ invalid: functionDirectoryEditor.errors.parentId }">
                <option v-for="option in functionDirectoryParentOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
              </select>
              <small v-if="functionDirectoryEditor.errors.parentId" class="field-error">{{ functionDirectoryEditor.errors.parentId }}</small>
            </label>
            <label>
              <span class="field-label required">目录名称 <em>必填</em></span>
              <input v-model.trim="functionDirectoryEditor.draft.name" :class="{ invalid: functionDirectoryEditor.errors.name }" placeholder="例如：活动运营">
              <small v-if="functionDirectoryEditor.errors.name" class="field-error">{{ functionDirectoryEditor.errors.name }}</small>
            </label>
            <label>
              <span class="field-label required">目录路由 <em>必填</em></span>
              <input v-model.trim="functionDirectoryEditor.draft.path" :class="{ invalid: functionDirectoryEditor.errors.path }" placeholder="例如 /ops/campaign">
              <small v-if="functionDirectoryEditor.errors.path" class="field-error">{{ functionDirectoryEditor.errors.path }}</small>
            </label>
            <label>
              <span class="field-label required">目录排序 <em>必填</em></span>
              <input v-model.number="functionDirectoryEditor.draft.order" :class="{ invalid: functionDirectoryEditor.errors.order }" type="number" min="1" placeholder="例如 10">
              <small v-if="functionDirectoryEditor.errors.order" class="field-error">{{ functionDirectoryEditor.errors.order }}</small>
            </label>
            <label class="full">
              <span class="field-label required">目录描述 <em>必填</em></span>
              <textarea v-model.trim="functionDirectoryEditor.draft.description" :class="{ invalid: functionDirectoryEditor.errors.description }" rows="3" placeholder="说明该目录承载的页面范围和业务边界。"></textarea>
              <small v-if="functionDirectoryEditor.errors.description" class="field-error">{{ functionDirectoryEditor.errors.description }}</small>
            </label>
          </div>
          <div class="modal-actions flat">
            <button type="button" class="ghost-btn" @click="closeFunctionMenuEditor">取消</button>
            <button type="button" class="primary-btn" @click="saveFunctionDirectoryEditor">保存目录</button>
          </div>
        </section>

        <section v-else-if="functionCreateTab === 'menu'" class="function-create-section">
          <div class="permission-form-grid function-editor-form">
            <label>
              <span class="field-label required">所属目录 <em>必填</em></span>
              <select v-model="functionMenuEditor.draft.parentId" :class="{ invalid: functionMenuEditor.errors.parentId }">
                <option v-for="option in functionMenuParentOptions" :key="option.id" :value="option.id">{{ option.label }}</option>
              </select>
              <small v-if="functionMenuEditor.errors.parentId" class="field-error">{{ functionMenuEditor.errors.parentId }}</small>
            </label>
            <label>
              <span class="field-label required">菜单名称 <em>必填</em></span>
              <input v-model.trim="functionMenuEditor.draft.name" :class="{ invalid: functionMenuEditor.errors.name }" placeholder="例如：质量分析">
              <small v-if="functionMenuEditor.errors.name" class="field-error">{{ functionMenuEditor.errors.name }}</small>
            </label>
            <label>
              <span class="field-label required">菜单路由 <em>必填</em></span>
              <input v-model.trim="functionMenuEditor.draft.path" :class="{ invalid: functionMenuEditor.errors.path }" placeholder="例如 /ops/quality">
              <small v-if="functionMenuEditor.errors.path" class="field-error">{{ functionMenuEditor.errors.path }}</small>
            </label>
            <label>
              <span class="field-label required">菜单排序 <em>必填</em></span>
              <input v-model.number="functionMenuEditor.draft.order" :class="{ invalid: functionMenuEditor.errors.order }" type="number" min="1" placeholder="例如 10">
              <small v-if="functionMenuEditor.errors.order" class="field-error">{{ functionMenuEditor.errors.order }}</small>
            </label>
            <label class="full">
              <span class="field-label required">菜单描述 <em>必填</em></span>
              <textarea v-model.trim="functionMenuEditor.draft.description" :class="{ invalid: functionMenuEditor.errors.description }" rows="3" placeholder="说明该菜单对应的页面、入口或业务模块。"></textarea>
              <small v-if="functionMenuEditor.errors.description" class="field-error">{{ functionMenuEditor.errors.description }}</small>
            </label>
          </div>
          <div class="modal-actions flat">
            <button type="button" class="ghost-btn" @click="closeFunctionMenuEditor">取消</button>
            <button type="button" class="primary-btn" @click="saveFunctionMenuEditor">保存菜单</button>
          </div>
        </section>

        <section v-else class="function-create-section">
          <div class="permission-form-grid function-editor-form">
            <div class="permission-form-field function-menu-field full">
              <span class="field-label required">所属菜单 <em>必填</em></span>
              <button type="button" :class="['function-menu-trigger', { invalid: functionEditor.errors.menu, active: functionEditor.menuPickerOpen }]" @click="functionEditor.menuPickerOpen = !functionEditor.menuPickerOpen">
                <span>{{ functionEditor.draft.menu || '请选择' }}</span>
                <i>⌄</i>
              </button>
              <div v-if="functionEditor.menuPickerOpen" class="function-menu-cascade">
                <div class="function-menu-column">
                  <button v-for="root in functionMenuTree" :key="root.id" type="button" :class="{ active: functionEditor.menuRootId === root.id }" @click="selectFunctionMenuRoot(root.id)"><span>{{ root.name }}</span><i>⌄</i></button>
                </div>
                <div class="function-menu-column">
                  <button v-for="child in activeFunctionMenuChildren" :key="child.id" type="button" :class="{ active: functionEditor.menuChildId === child.id || functionEditor.draft.menu === functionMenuFullPath(activeFunctionMenuRoot, child) }" @click="selectFunctionMenuChild(child.id)"><span>{{ child.name }}</span><i v-if="child.children.length">⌄</i></button>
                </div>
                <div v-if="activeFunctionMenuLeaves.length" class="function-menu-column leaf">
                  <button v-for="leaf in activeFunctionMenuLeaves" :key="leaf.id" type="button" :class="{ active: functionEditor.draft.menu === functionMenuFullPath(activeFunctionMenuRoot, activeFunctionMenuChild, leaf) }" @click="selectFunctionMenuLeaf(leaf.name)">{{ leaf.name }}</button>
                </div>
              </div>
              <small v-if="functionEditor.errors.menu" class="field-error">{{ functionEditor.errors.menu }}</small>
            </div>
            <label>
              <span class="field-label required">功能名称 <em>必填</em></span>
              <input v-model.trim="functionEditor.draft.name" :class="{ invalid: functionEditor.errors.name }" placeholder="例如：数据导出">
              <small v-if="functionEditor.errors.name" class="field-error">{{ functionEditor.errors.name }}</small>
            </label>
            <div class="permission-form-field">
              <span class="field-label required">类型 <em>必填</em></span>
              <div class="handler-chip-list function-type-radio" :class="{ invalid: functionEditor.errors.type }">
                <button v-for="type in functionTypeOptions" :key="type.value" type="button" :class="{ active: functionEditor.draft.type === type.value }" @click="functionEditor.draft.type = type.value">{{ type.label }}</button>
              </div>
              <small v-if="functionEditor.errors.type" class="field-error">{{ functionEditor.errors.type }}</small>
            </div>
            <label class="full">
              <span class="field-label required">功能描述 <em>必填</em></span>
              <textarea v-model.trim="functionEditor.draft.description" :class="{ invalid: functionEditor.errors.description }" rows="3" placeholder="说明该功能给谁使用、能完成什么操作。"></textarea>
              <small v-if="functionEditor.errors.description" class="field-error">{{ functionEditor.errors.description }}</small>
            </label>
            <div class="permission-form-field full">
              <span class="field-label required">关联接口 <em>必填</em></span>
              <div class="function-interface-manual">
                <table class="permission-table function-interface-table manual-interface-table">
                  <thead><tr><th>排序</th><th>接口</th><th>接口地址</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="api in functionEditor.draft.interfaces" :key="api.id">
                      <td><input v-model.trim="api.order" placeholder="输入排序" class="interface-order-input"></td>
                      <td><input v-model.trim="api.name" placeholder="请输入接口名称"></td>
                      <td><input v-model.trim="api.url" placeholder="请输入接口地址"></td>
                      <td><button type="button" class="link-btn danger" @click="removeFunctionInterface(api.id)">删除</button></td>
                    </tr>
                  </tbody>
                </table>
                <button type="button" class="ghost-btn small" @click="addFunctionInterface">添加接口</button>
              </div>
              <small v-if="functionEditor.errors.interfaces" class="field-error">{{ functionEditor.errors.interfaces }}</small>
            </div>
          </div>
          <div class="modal-actions flat">
            <button type="button" class="ghost-btn" @click="closeFunctionMenuEditor">取消</button>
            <button type="button" class="primary-btn" @click="saveFunctionEditor">保存功能</button>
          </div>
        </section>
      </div>
    </div>
    <div v-if="functionEditor.visible && functionEditor.mode === 'edit'" class="permission-modal" @click.self="closeFunctionEditor">
      <div class="modal-panel function-editor-modal">
        <button type="button" class="modal-close" @click="closeFunctionEditor">×</button>
        <h3>{{ functionEditor.mode === 'create' ? '新增功能' : '编辑功能' }}</h3>
        <p class="modal-note">维护功能所在菜单、展示名称、业务说明、功能类型和关联接口。</p>
        <div class="permission-form-grid function-editor-form">
          <div class="permission-form-field function-menu-field">
            <span class="field-label required">所属菜单 <em>必填</em></span>
            <button type="button" :class="['function-menu-trigger', { invalid: functionEditor.errors.menu, active: functionEditor.menuPickerOpen }]" @click="functionEditor.menuPickerOpen = !functionEditor.menuPickerOpen">
              <span>{{ functionEditor.draft.menu || '请选择' }}</span>
              <i>⌄</i>
            </button>
            <div v-if="functionEditor.menuPickerOpen" class="function-menu-cascade">
              <div class="function-menu-column">
                <button
                  v-for="root in functionMenuTree"
                  :key="root.id"
                  type="button"
                  :class="{ active: functionEditor.menuRootId === root.id }"
                  @click="selectFunctionMenuRoot(root.id)"
                >
                  <span>{{ root.name }}</span>
                  <i>⌄</i>
                </button>
              </div>
              <div class="function-menu-column">
                <button
                  v-for="child in activeFunctionMenuChildren"
                  :key="child.id"
                  type="button"
                  :class="{ active: functionEditor.menuChildId === child.id || functionEditor.draft.menu === functionMenuFullPath(activeFunctionMenuRoot, child) }"
                  @click="selectFunctionMenuChild(child.id)"
                >
                  <span>{{ child.name }}</span>
                  <i v-if="child.children.length">⌄</i>
                </button>
              </div>
              <div v-if="activeFunctionMenuLeaves.length" class="function-menu-column leaf">
                <button
                  v-for="leaf in activeFunctionMenuLeaves"
                  :key="leaf.id"
                  type="button"
                  :class="{ active: functionEditor.draft.menu === functionMenuFullPath(activeFunctionMenuRoot, activeFunctionMenuChild, leaf) }"
                  @click="selectFunctionMenuLeaf(leaf.name)"
                >{{ leaf.name }}</button>
              </div>
            </div>
            <small v-if="functionEditor.errors.menu" class="field-error">{{ functionEditor.errors.menu }}</small>
          </div>
          <label>
            <span class="field-label required">功能名称 <em>必填</em></span>
            <input v-model.trim="functionEditor.draft.name" :class="{ invalid: functionEditor.errors.name }" placeholder="例如：数据导出">
            <small v-if="functionEditor.errors.name" class="field-error">{{ functionEditor.errors.name }}</small>
          </label>
          <div class="permission-form-field full">
            <span class="field-label required">类型 <em>必填</em></span>
            <div class="handler-chip-list function-type-radio" :class="{ invalid: functionEditor.errors.type }">
              <button
                v-for="type in functionTypeOptions"
                :key="type.value"
                type="button"
                :class="{ active: functionEditor.draft.type === type.value }"
                @click="functionEditor.draft.type = type.value"
              >{{ type.label }}</button>
            </div>
            <small v-if="functionEditor.errors.type" class="field-error">{{ functionEditor.errors.type }}</small>
          </div>
          <label class="full">
            <span class="field-label required">功能描述 <em>必填</em></span>
            <textarea v-model.trim="functionEditor.draft.description" :class="{ invalid: functionEditor.errors.description }" rows="3" placeholder="说明该功能给谁使用、能完成什么操作。"></textarea>
            <small v-if="functionEditor.errors.description" class="field-error">{{ functionEditor.errors.description }}</small>
          </label>
        </div>

        <div class="function-interface-editor">
          <div class="permission-subhead custom-rule-head">
            <div>
              <b>关联接口</b>
              <small>手动填写排序、接口名称和接口地址，可添加多个接口；删除只影响当前功能配置。</small>
            </div>
          </div>
          <small v-if="functionEditor.errors.interfaces" class="field-error">{{ functionEditor.errors.interfaces }}</small>
          <table class="permission-table function-interface-table manual-interface-table">
            <thead><tr><th>排序</th><th>接口</th><th>接口地址</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="api in functionEditor.draft.interfaces" :key="api.id">
                <td><input v-model.trim="api.order" placeholder="输入排序" class="interface-order-input"></td>
                <td><input v-model.trim="api.name" placeholder="请输入接口名称"></td>
                <td><input v-model.trim="api.url" placeholder="请输入接口地址"></td>
                <td><button type="button" class="link-btn danger" @click="removeFunctionInterface(api.id)">删除</button></td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="ghost-btn small manual-interface-add" @click="addFunctionInterface">添加接口</button>
        </div>

        <span v-if="functionEditor.notice" class="approval-feedback">{{ functionEditor.notice }}</span>
        <div class="modal-actions">
          <button type="button" class="ghost-btn" @click="closeFunctionEditor">取消</button>
          <button v-if="functionEditor.mode === 'edit'" type="button" class="danger-outline-btn small" @click="deleteManagedFunction">删除</button>
          <button type="button" class="primary-btn" @click="saveFunctionEditor">保存</button>
        </div>
      </div>
    </div>
    <div v-if="dataSourceEditor.visible" class="permission-modal" @click.self="closeDataSourceEditor">
      <div class="modal-panel datasource-editor-modal">
        <button type="button" class="modal-close" @click="closeDataSourceEditor">×</button>
        <h3>{{ dataSourceEditor.mode === 'create' ? '新增数据源' : '编辑数据源' }}</h3>
        <p class="modal-note">维护接口授权所需的基础信息，保存后立即更新数据源列表。</p>
        <div class="permission-form-grid datasource-editor-form">
          <div class="permission-form-field function-menu-field datasource-menu-field">
            <span class="field-label required">所属一级目录 <em>必填</em></span>
            <button type="button" :class="['function-menu-trigger', { invalid: dataSourceEditor.errors.menu, active: dataSourceEditor.menuPickerOpen }]" @click="dataSourceEditor.menuPickerOpen = !dataSourceEditor.menuPickerOpen">
              <span>{{ dataSourceEditor.draft.menu || '请选择一级目录 / 大菜单' }}</span>
              <i>⌄</i>
            </button>
            <div v-if="dataSourceEditor.menuPickerOpen" class="function-menu-cascade datasource-menu-cascade datasource-root-only">
              <div class="function-menu-column">
                <button v-for="root in functionMenuTree" :key="root.id" type="button" :class="{ active: dataSourceEditor.menuRootId === root.id }" @click="selectDataSourceMenuRoot(root.id)"><span>{{ root.name }}</span></button>
              </div>
            </div>
            <small v-if="dataSourceEditor.errors.menu" class="field-error">{{ dataSourceEditor.errors.menu }}</small>
          </div>
          <label><span class="field-label required">名称 <em>必填</em></span><input v-model.trim="dataSourceEditor.draft.name" :class="{ invalid: dataSourceEditor.errors.name }" placeholder="例如：运营指标查询"><small v-if="dataSourceEditor.errors.name" class="field-error">{{ dataSourceEditor.errors.name }}</small></label>
          <label><span class="field-label required">接口地址 <em>必填</em></span><input v-model.trim="dataSourceEditor.draft.apiUrl" :class="{ invalid: dataSourceEditor.errors.apiUrl }" placeholder="例如：/api/ops/metrics"><small v-if="dataSourceEditor.errors.apiUrl" class="field-error">{{ dataSourceEditor.errors.apiUrl }}</small></label>
          <label><span class="field-label required">权限参数 <em>必填</em></span><input v-model.trim="dataSourceEditor.draft.permissionParam" :class="{ invalid: dataSourceEditor.errors.permissionParam }" placeholder="例如：regionCode"><small v-if="dataSourceEditor.errors.permissionParam" class="field-error">{{ dataSourceEditor.errors.permissionParam }}</small></label>
          <label><span>key</span><input v-model.trim="dataSourceEditor.draft.key" placeholder="例如：scope"></label>
          <label><span>Value</span><input v-model.trim="dataSourceEditor.draft.value" placeholder="例如：east"></label>
          <label><span>敏感性</span><select v-model="dataSourceEditor.draft.sensitivity"><option v-for="option in dataSourceSensitivityOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
          <label class="full"><span>备注 <em>{{ dataSourceEditor.draft.remark.length }}/120</em></span><textarea v-model.trim="dataSourceEditor.draft.remark" :class="{ invalid: dataSourceEditor.errors.remark }" rows="4" placeholder="说明该参数用于什么授权场景，业务人员需要注意什么。"></textarea><small v-if="dataSourceEditor.errors.remark" class="field-error">{{ dataSourceEditor.errors.remark }}</small></label>
        </div>
        <span v-if="dataSourceEditor.notice" class="approval-feedback">{{ dataSourceEditor.notice }}</span>
        <div class="modal-actions"><button type="button" class="ghost-btn" @click="closeDataSourceEditor">取消</button><button type="button" class="primary-btn" @click="saveDataSourceEditor">保存</button></div>
      </div>
    </div>

    <div v-if="approvalWorkspace.visible && activeApproval" class="permission-modal" @click.self="closeApprovalWorkspace">
      <div class="modal-panel approval-workspace-modal">
        <button type="button" class="modal-close" @click="closeApprovalWorkspace">×</button>
        <div class="approval-workspace-head">
          <div>
            <h3>{{ approvalWorkspace.title }}</h3>
            <p>{{ activeApproval.id }} · {{ activeApproval.type }} · {{ activeApproval.node }}</p>
          </div>
          <span class="table-status" :class="approvalDisplayStatusKey(activeApproval)">{{ approvalDisplayStatus(activeApproval) }}</span>
        </div>

        <div class="approval-workspace-body">
          <section v-if="activeApprovalBusinessTasks.length" class="approval-readonly-panel business-progress-panel">
            <div class="scope-panel-head">
              <div>
                <b>业务负责人审批进度</b>
                <small>{{ businessApprovalProgressText }}</small>
              </div>
            </div>
            <div class="business-task-list">
              <article v-for="task in activeApprovalBusinessTasks" :key="task.approver" :class="['business-task-card', task.status]">
                <div>
                  <b>{{ task.approverName || task.approver }}</b>
                  <p>{{ task.roleNames.join('、') || '未关联角色' }}</p>
                  <small v-if="task.organizations?.length">所属组织：{{ task.organizations.join('、') }}</small>
                  <small v-else>所属组织待填写</small>
                </div>
                <span :class="['table-status', task.status === 'approved' ? 'done' : task.status === 'rejected' ? 'rejected' : 'pending']">{{ businessTaskStatusLabel(task) }}</span>
              </article>
            </div>
          </section>

          <section class="approval-readonly-panel">
            <div class="scope-panel-head">
              <div>
                <b>完整审批链路</b>
                <small>侧栏只展示当前节点附近步骤，完整流转在这里查看。</small>
              </div>
            </div>
            <ol class="approval-full-route-list">
              <li v-for="step in activeApprovalFullRouteSteps" :key="step.key" :class="step.state">
                <span aria-hidden="true"></span>
                <div><b>{{ step.label }}</b><small>{{ step.description }}</small></div>
              </li>
            </ol>
          </section>

          <section class="approval-readonly-panel">
            <div class="scope-panel-head">
              <div>
                <b>基本信息</b>
                <small>申请人、被申请人和审批路径信息只读展示。</small>
              </div>
            </div>
            <dl class="approval-detail-grid">
              <template v-for="item in activeApprovalBasicFields" :key="item.label">
                <dt>{{ item.label }}</dt>
                <dd>{{ item.value }}</dd>
              </template>
            </dl>
          </section>



          <section v-if="approvalWorkspace.nodeType === 'business'" class="approval-edit-panel">
            <div class="scope-panel-head">
              <div>
                <b>业务归属</b>
                <small>业务负责人确认本申请的所属组织，审批通过后系统统一执行。</small>
              </div>
            </div>
            <div class="permission-form-grid approval-business-form">
              <div class="permission-form-field full">
                <span class="field-label required">所属组织 <em>必填</em></span>
                <div class="handler-chip-list organization-picker">
                  <button
                    v-for="org in organizationOptions"
                    :key="org"
                    type="button"
                    :class="{ active: approvalWorkspace.organizations.includes(org) }"
                    :disabled="!canEditBusinessOwnership"
                    @click="toggleApprovalOrganization(org)"
                  >{{ org }}</button>
                </div>
                <small v-if="approvalWorkspace.errors.organizations" class="field-error">{{ approvalWorkspace.errors.organizations }}</small>
              </div>
            </div>
          </section>

          <section class="approval-readonly-panel">
            <div class="scope-panel-head">
              <div>
                <b>本次权限变更</b>
                <small>{{ activeApprovalChangeSummary.length ? '只展示本次申请相对原权限的变化内容。' : '当前申请未记录到权限变更内容。' }}</small>
              </div>
            </div>
            <div v-if="activeApprovalChangeSummary.length" class="change-summary-list readonly-change-summary">
              <article v-for="item in activeApprovalChangeSummary" :key="item.key" class="change-summary-item">
                <b>{{ item.label }}</b>
                <p>{{ item.detail }}</p>
              </article>
            </div>
            <div v-else class="scope-empty source-empty">
              <b>未检测到权限变更内容</b>
              <p>审批人可驳回申请，让申请人补充角色、功能权限、数据权限、复制他人角色或所属租户变化。</p>
            </div>
          </section>

          <section class="approval-readonly-panel approval-permission-scope-panel">
            <div class="scope-panel-head">
              <div>
                <b>完整权限范围</b>
                <small>{{ canEditApprovalPermission ? '直线经理可在审批前调整角色、复制权限和数据权限范围。' : '当前为只读查看，展示本次申请提交后的完整权限范围。' }}</small>
              </div>
            </div>
            <div v-if="canEditApprovalPermission" class="scope-action-bar inline approval-change-actions">
              <button type="button" class="primary-btn" @click="openRoleModal">添加角色</button>
              <button type="button" class="ghost-btn" :disabled="!!copiedFromUser" @click="openCopyModal">复制他人角色</button>
              <button type="button" class="ghost-btn" @click="openDataModal">选择数据权限</button>
            </div>
            <div class="scope-source-stack approval-scope-source-stack">
              <div v-if="!hasPermissionSources" class="scope-empty source-empty">
                <b>还没有选择权限范围</b>
                <p>{{ canEditApprovalPermission ? '可点击“添加角色”“复制他人角色”或“选择数据权限”补充申请内容。' : '当前申请未包含角色、复制权限或单独数据权限。' }}</p>
              </div>

              <article v-if="selectedRoles.length" class="scope-source-panel">
                <div class="scope-panel-head">
                  <div>
                    <b>添加角色</b>
                    <small>{{ selectedRoles.length }} 个角色，角色内绑定展示功能权限和数据权限</small>
                  </div>
                  <button v-if="canEditApprovalPermission" type="button" class="link-btn" @click="openRoleModal">调整角色</button>
                </div>
                <div class="source-role-list">
                  <div v-for="role in selectedRoles" :key="role.id" class="source-role-card compact-role-card">
                    <div class="source-role-title">
                      <div>
                        <b>{{ role.name }}</b>
                        <small>{{ role.desc }}</small>
                      </div>
                      <div class="role-card-actions">
                        <button type="button" class="link-btn" @click="openRoleCardDetail(role)">详情</button>
                        <button v-if="canEditApprovalPermission" type="button" class="link-btn danger" @click="removeRole(role.id)">移除</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article v-if="copiedFromUser" class="scope-source-panel">
                <div class="scope-panel-head">
                  <div>
                    <b>复制他人角色</b>
                    <small>复制自 {{ copiedFromUser.name }}（{{ copiedFromUser.itcode }}）</small>
                  </div>
                  <span class="readonly-source-badge">复制结果只读</span>
                </div>
                <div class="source-role-list">
                  <div v-for="role in copiedRoles" :key="role.id" class="source-role-card copied compact-role-card">
                    <div class="source-role-title">
                      <div>
                        <b>{{ role.name }}</b>
                        <small>{{ role.desc }}</small>
                      </div>
                      <div class="role-card-actions">
                        <button type="button" class="link-btn" @click="openRoleCardDetail(role, 'copied')">详情</button>
                      </div>
                    </div>
                  </div>
                  <div v-if="hasCopiedUserGrantedData" class="source-role-card copied">
                    <div class="source-role-title">
                      <div>
                        <b>用户单独授权的数据权限</b>
                        <small>只复制对方角色之外单独授权的数据权限。</small>
                      </div>
                    </div>
                    <div v-if="copiedUserGrantedDataPermissions.length" class="permission-chip-list compact">
                      <span v-for="permission in copiedUserGrantedDataPermissions" :key="permission.id">
                        {{ permission.name }}
                        <em class="source-tag user">用户单独授权</em>
                      </span>
                    </div>
                    <small v-else class="bound-empty">对方没有用户单独授权的数据权限。</small>
                  </div>
                </div>
              </article>

              <article v-if="manualDataPermissionDetails.length" class="scope-source-panel">
                <div class="scope-panel-head">
                  <div>
                    <b>选择数据权限</b>
                    <small>{{ manualDataPermissionDetails.length }} 项本次新增数据权限</small>
                  </div>
                  <button v-if="canEditApprovalPermission" type="button" class="link-btn" @click="openDataModal">调整数据权限</button>
                </div>
                <div class="permission-chip-list compact manual-data-list">
                  <span v-for="permission in manualDataPermissionDetails" :key="permission.id">
                    {{ permission.name }}
                    <button v-if="canEditApprovalPermission" type="button" class="chip-remove" @click="removeDataPermission(permission.id)">×</button>
                  </span>
                </div>
              </article>
            </div>
          </section>

          <section v-if="approvalWorkspace.mode === 'approve'" class="approval-decision-panel">
            <div class="scope-panel-head">
              <div>
                <b>{{ approvalDecisionTitle }}</b>
                <small>{{ approvalDecisionHint }}</small>
              </div>
            </div>
            <div class="approval-result-options" role="radiogroup" aria-label="审批结果">
              <button
                v-for="option in approvalResultOptions"
                :key="option.value"
                type="button"
                :class="{ active: approvalWorkspace.result === option.value }"
                @click="selectApprovalResult(option.value)"
              >{{ option.label }}</button>
            </div>
            <small v-if="approvalWorkspace.errors.result" class="field-error">{{ approvalWorkspace.errors.result }}</small>
            <label class="modal-form-field">
              <span>审批意见</span>
              <textarea v-model.trim="approvalWorkspace.opinion" rows="4" placeholder="请说明审批意见或需要申请人补充的内容。"></textarea>
            </label>
            <div class="approval-submit-note">
              <b>提交后将更新列表状态</b>
              <p>{{ approvalSubmitImpact }}</p>
            </div>
          </section>
        </div>

        <div class="modal-actions sticky-actions">
          <span v-if="approvalWorkspace.notice" class="approval-feedback">{{ approvalWorkspace.notice }}</span>
          <button type="button" class="ghost-btn" @click="closeApprovalWorkspace">{{ approvalWorkspace.mode === 'view' ? '关闭' : '取消' }}</button>
          <button v-if="approvalWorkspace.mode === 'approve'" type="button" class="primary-btn" @click="submitApprovalDecision">提交审批</button>
        </div>
      </div>
    </div>
    <div v-if="approvalNotificationModal.visible && submittedApproval" class="permission-modal" @click.self="closeApprovalNotificationModal">
      <div class="modal-panel approval-notification-modal simple-notice-modal">
        <button type="button" class="modal-close" @click="closeApprovalNotificationModal">×</button>
        <div class="simple-notice-title">提示</div>
        <div class="simple-notice-body">
          <h3>
            您提交的账号申请表单
            <button type="button" class="notice-ticket-link" @click="viewSubmittedApproval">{{ submittedApproval.id }}</button>
            已受理。
          </h3>
          <p>点击表单号码可查询审核状态。同时审核结果查询链接已发送至您的邮箱，请注意查收。</p>
          <p>如有疑问，请联系：<b>wusq16@lenovo.com</b>。</p>
        </div>
        <div class="modal-actions simple-notice-actions">
          <button type="button" class="ghost-btn" @click="closeApprovalNotificationModal">关闭</button>
        </div>
      </div>
    </div>    <div v-if="roleEditor.visible" class="permission-modal" @click.self="closeRoleEditor">
      <div class="modal-panel role-editor-modal">
        <button type="button" class="modal-close" @click="closeRoleEditor">×</button>
        <div class="role-editor-head">
          <div>
            <h3>{{ roleEditorTitle }}</h3>
            <p>{{ roleEditor.mode === 'view' ? '当前为只读查看，可切换到编辑后维护角色信息和权限范围。' : '保存前仅修改当前草稿，取消不会影响角色列表和申请流程。' }}</p>
          </div>
          <span v-if="roleEditor.draft.sensitivity" :class="['sensitivity-badge', sensitivityRisk(roleEditor.draft.sensitivity)]">{{ sensitivityLabel(roleEditor.draft.sensitivity) }}</span>
        </div>

        <div class="role-impact-strip">
          <span>影响用户 <b>{{ roleEditor.draft.users || 0 }}</b> 人</span>
          <span>功能权限 <b>{{ roleEditor.draft.functionPermissionIds.length }}</b> 项</span>
          <span>普通数据权限 <b>{{ roleEditor.draft.dataPermissionIds.length }}</b> 项</span>
          <span>自定义授权 <b>{{ roleEditor.draft.customDataRules.length }}</b> 条</span>
        </div>

        <div class="role-editor-tabs" role="tablist" aria-label="角色编辑区">
          <button type="button" :class="{ active: roleEditor.activeTab === 'basic' }" @click="roleEditor.activeTab = 'basic'">基本信息</button>
          <button type="button" :class="{ active: roleEditor.activeTab === 'function' }" @click="roleEditor.activeTab = 'function'">功能权限</button>
          <button type="button" :class="{ active: roleEditor.activeTab === 'data' }" @click="roleEditor.activeTab = 'data'">数据权限</button>
        </div>

        <section v-if="roleEditor.activeTab === 'basic'" class="role-editor-section">
          <div class="permission-form-grid role-basic-form">
            <label>
              <span class="field-label required">角色名称 <em>必填</em></span>
              <input v-model.trim="roleEditor.draft.name" :readonly="roleEditorReadonly" :class="{ invalid: roleEditor.errors.name }" placeholder="例如：运营分析 PM">
              <small v-if="roleEditor.errors.name" class="field-error">{{ roleEditor.errors.name }}</small>
            </label>
            <label>
              <span class="field-label required">角色类型 <em>必填</em></span>
              <select v-model="roleEditor.draft.type" :disabled="roleEditorReadonly" :class="{ invalid: roleEditor.errors.type }">
                <option disabled value="">请选择角色类型</option>
                <option v-for="type in roleTypeOptions" :key="type" :value="type">{{ type }}</option>
              </select>
              <small v-if="roleEditor.errors.type" class="field-error">{{ roleEditor.errors.type }}</small>
              <small v-else class="field-help">角色管理员可管理当前角色组内的角色，普通角色不具备角色管理权限。</small>
            </label>
            <label>
              <span class="field-label required">角色组 <em>必填</em></span>
              <select v-model="roleEditor.draft.group" :disabled="roleEditorReadonly" :class="{ invalid: roleEditor.errors.group }">
                <option disabled value="">请选择角色组</option>
                <option v-for="group in roleGroupOptions" :key="group" :value="group">{{ group }}</option>
              </select>
              <small v-if="roleEditor.errors.group" class="field-error">{{ roleEditor.errors.group }}</small>
            </label>
            <label>
              <span class="field-label required">业务负责人 <em>必填</em></span>
              <input v-model.trim="roleEditor.draft.owner" :readonly="roleEditorReadonly" :class="{ invalid: roleEditor.errors.owner }" placeholder="输入负责人 ITCode 或姓名">
              <small v-if="roleEditor.errors.owner" class="field-error">{{ roleEditor.errors.owner }}</small>
            </label>
            <label class="full">
              <span>角色描述</span>
              <textarea v-model.trim="roleEditor.draft.desc" :readonly="roleEditorReadonly" rows="3" placeholder="说明这个角色能做什么、适合哪些人员使用。"></textarea>
            </label>
            <label class="full">
              <span class="field-label required">敏感性 <em>必填</em></span>
              <select v-model="roleEditor.draft.sensitivity" :disabled="roleEditorReadonly">
                <option v-for="option in sensitivityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <small class="field-help">{{ sensitivityDescription(roleEditor.draft.sensitivity) }}</small>
            </label>
          </div>
        </section>

        <section v-else-if="roleEditor.activeTab === 'function'" class="role-editor-section">
          <div class="permission-subhead custom-rule-head">
            <div>
              <b>功能权限</b>
              <small>功能权限继续按门户工作台目录和页面展示，用于决定角色可执行的操作。</small>
            </div>
          </div>
          <div class="role-permission-tree editor-permission-tree">
            <details v-for="root in permissionEditorTree()" :key="root.id" class="permission-tree-root">
              <summary><b>{{ root.name }}</b><span>{{ root.children.reduce((sum, branch) => sum + branch.functions.length, 0) }} 项功能</span></summary>
              <div class="permission-tree-branch-list">
                <details v-for="branch in root.children.filter((item) => item.functions.length)" :key="branch.id" class="permission-tree-branch" open>
                  <summary><b>{{ branch.name }}</b><span>{{ branch.functions.length }} 项功能</span></summary>
                  <div class="permission-item-list">
                    <label v-for="permission in branch.functions" :key="permission.id" class="permission-detail-check">
                      <input type="checkbox" :disabled="roleEditorReadonly" :checked="roleEditor.draft.functionPermissionIds.includes(permission.id)" @change="toggleRoleFunctionPermission(permission.id)">
                      <span><b>{{ permission.name }}</b><small>{{ permission.description || permission.id }}</small></span>
                    </label>
                  </div>
                </details>
              </div>
            </details>
          </div>
        </section>

        <section v-else class="role-editor-section">
          <div class="role-data-tabs" role="tablist" aria-label="数据权限类型">
            <button type="button" :class="{ active: roleEditor.dataTab === 'normal', locked: roleCustomDataLocked }" @click="switchRoleDataTab('normal')">普通授权</button>
            <button type="button" :class="{ active: roleEditor.dataTab === 'custom', locked: roleNormalDataLocked }" @click="switchRoleDataTab('custom')">自定义授权</button>
          </div>

          <div v-if="roleDataModeNotice || roleEditor.errors.dataMode" :class="['data-mode-notice', { error: roleEditor.errors.dataMode }]">{{ roleEditor.errors.dataMode || roleDataModeNotice }}</div>
          <div v-if="roleEditor.dataTab === 'normal'" class="role-permission-tree editor-permission-tree data-directory-tree">
            <PermissionDataDirectoryList
              :directories="dataPermissionDirectories"
              :selected-ids="roleEditor.draft.dataPermissionIds"
              :disabled="roleEditorReadonly || roleCustomDataLocked"
              @toggle="toggleRoleDataPermission"
            />
            <div v-if="!roleEditorSelectedDataPermissions.length" class="scope-empty compact-empty inline-empty">
              <b>还没有选择普通数据权限</b>
              <p>请在右侧数据权限列中勾选角色可以访问的数据范围。</p>
            </div>
          </div>
          <div v-else class="custom-rule-panel">
            <CustomTableAuthorizationEditor
              :model-value="roleEditor.draft.customDataRules"
              title="角色自定义授权"
              can-manage-dataset-tags
              :readonly="roleEditorReadonly"
              :disabled="roleNormalDataLocked"
              @update:model-value="updateRoleCustomDataRules"
            />
          </div>
        </section>

        <div class="modal-actions sticky-actions">
          <span v-if="roleEditor.notice" class="approval-feedback">{{ roleEditor.notice }}</span>
          <button type="button" class="ghost-btn" @click="closeRoleEditor">{{ roleEditor.mode === 'view' ? '关闭' : '取消' }}</button>
          <button v-if="roleEditor.mode === 'view'" type="button" class="primary-btn" @click="switchRoleEditorToEdit">进入编辑</button>
          <button v-else type="button" class="primary-btn" @click="saveRoleEditor">保存</button>
        </div>
      </div>
    </div>

    <div v-if="roleDeleteConfirm.visible" class="permission-modal" @click.self="closeRoleDeleteConfirm">
      <div class="modal-panel small">
        <button type="button" class="modal-close" @click="closeRoleDeleteConfirm">×</button>
        <h3>删除角色确认</h3>
        <p class="modal-note">{{ roleDeleteImpactText }}</p>
        <div v-if="roleDeleteBlockReason" class="delete-block-box">
          <b>暂不能删除</b>
          <p>{{ roleDeleteBlockReason }}</p>
        </div>
        <div v-else class="delete-impact-list">
          <span>功能权限 {{ roleDeleteConfirm.role?.functionPermissionIds?.length || 0 }} 项</span>
          <span>普通数据权限 {{ roleDeleteConfirm.role?.dataPermissionIds?.length || 0 }} 项</span>
          <span>自定义授权 {{ roleDeleteConfirm.role?.customDataRules?.length || 0 }} 条</span>
        </div>
        <div class="modal-actions">
          <button type="button" class="ghost-btn" @click="closeRoleDeleteConfirm">取消</button>
          <button v-if="!roleDeleteBlockReason" type="button" class="danger-btn" @click="confirmDeleteRole">确认删除</button>
        </div>
      </div>
    </div>
    <div v-if="userWorkspace.visible" class="permission-modal" @click.self="closeUserWorkspace">
      <div class="modal-panel role-editor-modal user-editor-modal">
        <button type="button" class="modal-close" @click="closeUserWorkspace">×</button>
        <div class="role-editor-head">
          <div>
            <h3>{{ userWorkspaceTitle }}</h3>
            <p>{{ userWorkspace.mode === 'view' ? '当前为只读详情，可查看基本信息与当前生效的权限范围。' : '基本信息直接保存；租户、角色和数据权限变更提交审批，审批通过后生效。' }}</p>
          </div>
          <span v-if="userWorkspace.draft" class="table-status user-modal-status" :class="userWorkspace.draft.statusKey">{{ userStatusLabel(userWorkspace.draft) }}</span>
        </div>

        <div v-if="userWorkspace.draft" class="role-impact-strip user-impact-strip">
          <span>已分配角色 <b>{{ userWorkspace.draft.roleIds.length }}</b> 个</span>
          <span>额外普通数据 <b>{{ userWorkspace.draft.extraDataPermissionIds.length }}</b> 项</span>
          <span>自定义数据授权 <b>{{ userWorkspace.draft.customDataRules.length }}</b> 条</span>
        </div>

        <div v-if="activePendingUserPermissionApproval" class="user-application-strip warning">
          <div>
            <b>已有权限变更正在审批</b>
            <span>申请单号 {{ activePendingUserPermissionApproval.id }}，审批结束前不可再次调整租户、角色或数据权限；基本信息仍可保存。</span>
          </div>
        </div>
        <div v-else-if="userPermissionChanged" class="user-application-strip">
          <div>
            <b>将提交权限变更申请</b>
            <span>无需手工填写申请单号，提交后由系统自动生成；审批通过前继续使用当前权限。</span>
          </div>
        </div>

        <div class="role-editor-tabs" role="tablist" aria-label="用户编辑区">
          <button type="button" :class="{ active: userWorkspace.activeTab === 'basic' }" @click="userWorkspace.activeTab = 'basic'">基本信息</button>
          <button type="button" :class="{ active: userWorkspace.activeTab === 'roles' }" @click="userWorkspace.activeTab = 'roles'">已分配角色</button>
          <button type="button" :class="{ active: userWorkspace.activeTab === 'data' }" @click="userWorkspace.activeTab = 'data'">数据权限</button>
          <button type="button" :class="{ active: userWorkspace.activeTab === 'history' }" @click="userWorkspace.activeTab = 'history'">历史变更</button>
          <button type="button" :class="{ active: userWorkspace.activeTab === 'login' }" @click="userWorkspace.activeTab = 'login'">登录日志</button>
        </div>

        <section v-if="userWorkspace.draft && userWorkspace.activeTab === 'basic'" class="role-editor-section user-basic-section">
          <div class="user-basic-section-head">
            <div><b>用户身份</b><small>字段口径与权限申请的人员信息保持一致。</small></div>
          </div>
          <div class="permission-form-grid role-basic-form user-basic-form">
            <div class="permission-form-field full">
              <span class="field-label required">人员类型 <em>必填</em></span>
              <div class="person-type-switch compact" role="radiogroup" aria-label="人员类型">
                <button type="button" :class="{ active: userWorkspace.draft.userType !== '外部用户' }" :disabled="userWorkspaceReadonly" @click="setUserType('内部用户')"><b>内部人员</b><small>联想内部员工或已有正式账号人员。</small></button>
                <button type="button" :class="{ active: userWorkspace.draft.userType === '外部用户' }" :disabled="userWorkspaceReadonly" @click="setUserType('外部用户')"><b>外部人员</b><small>供应商、外包或临时协作人员。</small></button>
              </div>
            </div>

            <label><span class="field-label required">{{ userWorkspace.draft.userType === '外部用户' ? '用户名' : '用户 ITCode' }} <em>必填</em></span><input v-model.trim="userWorkspace.draft.loginAccount" :readonly="userWorkspaceReadonly" :class="{ invalid: userWorkspace.errors.loginAccount }" :placeholder="userWorkspace.draft.userType === '外部用户' ? '请输入外部用户登录名' : '例如 zhangrui32'"><small v-if="userWorkspace.errors.loginAccount" class="field-error">{{ userWorkspace.errors.loginAccount }}</small></label>
            <label><span>手机号</span><input v-model.trim="userWorkspace.draft.mobile" :readonly="userWorkspaceReadonly" placeholder="请输入手机号"></label>
            <label><span>邮箱</span><input v-model.trim="userWorkspace.draft.email" :readonly="userWorkspaceReadonly" placeholder="name@lenovo.com"></label>
            <label v-if="userWorkspace.draft.userType === '外部用户'" class="relation-account-field"><span class="field-label required">关联人 ITCode <em>必填</em></span><input v-model.trim="userWorkspace.draft.relatedAccount" :readonly="userWorkspaceReadonly" :class="{ invalid: userWorkspace.errors.relatedAccount }" placeholder="请输入负责对接的内部员工 ITCode"><small v-if="userWorkspace.errors.relatedAccount" class="field-error">{{ userWorkspace.errors.relatedAccount }}</small></label>
            <label v-else><span class="field-label required">用户直线经理 <em>必填</em></span><input v-model.trim="userWorkspace.draft.targetManager" :readonly="userWorkspaceReadonly" :class="{ invalid: userWorkspace.errors.targetManager }" placeholder="例如 wangxt8"><small v-if="userWorkspace.errors.targetManager" class="field-error">{{ userWorkspace.errors.targetManager }}</small></label>

            <div class="user-basic-section-head full"><div><b>租户与账号设置</b><small>所属租户支持多选，租户变化按权限范围变更提交审批。</small></div></div>
            <div class="permission-form-field full">
              <span class="field-label required">所属租户 <em>必填</em></span>
              <div :class="['tenant-multi-options', { invalid: userWorkspace.errors.tenant }]">
                <label v-for="tenant in tenantOptions" :key="tenant" :class="{ selected: userWorkspace.draft.tenant.includes(tenant) }"><input type="checkbox" :checked="userWorkspace.draft.tenant.includes(tenant)" :disabled="userWorkspacePermissionReadonly" @change="toggleUserTenant(tenant)"><span>{{ tenant }}</span></label>
              </div>
              <small v-if="userWorkspace.errors.tenant" class="field-error">{{ userWorkspace.errors.tenant }}</small>
            </div>
            <BusinessApproverField v-if="!userWorkspaceReadonly && (userWorkspace.mode === 'create' || userPermissionChanged)" v-model="userWorkspace.draft.businessApprover" :error="userWorkspace.errors.businessApprover" :disabled="userWorkspacePermissionReadonly" @update:model-value="userWorkspace.errors.businessApprover = ''" />
            <label><span class="field-label required">有效期 <em>必填</em></span><input v-model.trim="userWorkspace.draft.validUntil" :readonly="userWorkspaceReadonly" :class="{ invalid: userWorkspace.errors.validUntil }" placeholder="例如 2026-12-31"><small v-if="userWorkspace.errors.validUntil" class="field-error">{{ userWorkspace.errors.validUntil }}</small></label>
            <div class="permission-form-field full">
              <span>所属组织（可多选）</span>
              <div class="tenant-multi-options organization-multi-options">
                <label v-for="org in organizationOptions" :key="org" :class="{ selected: userWorkspace.draft.organization.includes(org) }"><input type="checkbox" :checked="userWorkspace.draft.organization.includes(org)" :disabled="userWorkspaceReadonly" @change="toggleUserOrganization(org)"><span>{{ org }}</span></label>
              </div>
            </div>
            <label class="full"><span>备注</span><textarea v-model.trim="userWorkspace.draft.remark" :readonly="userWorkspaceReadonly" rows="3" placeholder="补充账号用途、有效期或运营备注。"></textarea></label>
          </div>
        </section>

        <section v-else-if="userWorkspace.draft && userWorkspace.activeTab === 'roles'" class="role-editor-section">
          <div class="permission-subhead custom-rule-head">
            <div>
              <b>已分配角色</b>
              <small>这里展示用户已有角色；角色内的功能和数据权限可按当前用户需要调整。</small>
            </div>
            <button v-if="!userWorkspacePermissionReadonly" type="button" class="primary-btn" @click="openUserRoleModal(userWorkspace.draft)">添加角色</button>
          </div>
          <div v-if="userDraftRoles.length" class="source-role-list">
            <div v-for="role in userDraftRoles" :key="role.id" class="source-role-card compact-role-card">
              <div class="source-role-title">
                <div>
                  <b>{{ role.name }}</b>
                  <small>{{ role.group }} · {{ role.desc }}</small>
                </div>
                <div class="role-card-actions">
                  <span :class="['sensitivity-badge', sensitivityRisk(role.sensitivity)]">{{ sensitivityLabel(role.sensitivity) }}</span>
                  <button type="button" class="link-btn" @click="openRoleCardDetail(role, 'userWorkspace')">详情</button>
                  <button v-if="!userWorkspacePermissionReadonly" type="button" class="link-btn danger" @click="removeUserDraftRole(role.id)">移除</button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="scope-empty compact-empty">
            <b>还没有分配角色</b>
            <p>请点击“添加角色”，为用户补充基础角色；用户层面仅支持额外数据权限。</p>
          </div>
        </section>
        <section v-else-if="userWorkspace.draft && userWorkspace.activeTab === 'data'" class="role-editor-section">
          <div class="role-data-tabs" role="tablist" aria-label="用户数据权限类型">
            <button type="button" :class="{ active: userWorkspace.dataTab === 'normal', locked: userCustomDataLocked }" @click="switchUserDataTab('normal')">普通授权</button>
            <button type="button" :class="{ active: userWorkspace.dataTab === 'custom', locked: userNormalDataLocked }" @click="switchUserDataTab('custom')">自定义授权</button>
          </div>
          <div v-if="userDataModeNotice || userWorkspace.errors.dataMode" :class="['data-mode-notice', { error: userWorkspace.errors.dataMode }]">{{ userWorkspace.errors.dataMode || userDataModeNotice }}</div>
          <div v-if="userWorkspace.dataTab === 'normal'" class="role-permission-tree editor-permission-tree data-directory-tree">
            <PermissionDataDirectoryList
              :directories="dataPermissionDirectories"
              :selected-ids="userWorkspaceSelectedDataIds"
              :disabled-ids="userDraftInheritedDataIds"
              :source-labels="userWorkspaceDataSourceLabels"
              :disabled="userWorkspacePermissionReadonly || userCustomDataLocked"
              @toggle="toggleUserExtraData"
            />
            <div v-if="!userDraftExtraDataPermissions.length" class="scope-empty compact-empty inline-empty">
              <b>没有额外普通数据权限</b>
              <p>角色继承的数据权限会只读展示；如需用户级补充授权，只在这里勾选额外数据权限。</p>
            </div>
          </div>
          <div v-else class="custom-rule-panel">
            <CustomTableAuthorizationEditor
              :model-value="userWorkspace.draft.customDataRules"
              title="用户自定义授权"
              can-manage-dataset-tags
              :readonly="userWorkspacePermissionReadonly"
              :disabled="userNormalDataLocked"
              @update:model-value="updateUserCustomDataRules"
            />
          </div>
        </section>

        <section v-else-if="userWorkspace.draft && userWorkspace.activeTab === 'history'" class="role-editor-section">
          <table v-if="userWorkspace.draft.changeLogs.length" class="permission-table user-history-table">
            <thead><tr><th>变更时间</th><th>类型</th><th>申请单号</th><th>详情</th></tr></thead>
            <tbody>
              <tr v-for="log in userWorkspace.draft.changeLogs" :key="log.time + log.type + log.ticketNo">
                <td>{{ log.time }}</td>
                <td>{{ log.type }}</td>
                <td>{{ log.ticketNo || '-' }}</td>
                <td>{{ log.detail }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="scope-empty compact-empty"><b>暂无历史变更</b><p>后续编辑、设置角色、分配权限或启禁用账号后，会在这里追加记录。</p></div>
          <div v-if="userWorkspace.draft.emailNotifications?.length" class="email-notice-list">
            <div class="permission-subhead compact-subhead"><b>邮件通知记录</b><small>当前为 POC mock，不会真实发送邮件。</small></div>
            <article v-for="mail in userWorkspace.draft.emailNotifications" :key="mail.time + mail.to">
              <b>{{ mail.subject }}</b>
              <p>{{ mail.content }}</p>
              <small>{{ mail.time }} · {{ mail.to }}</small>
            </article>
          </div>
        </section>

        <section v-else-if="userWorkspace.draft && userWorkspace.activeTab === 'login'" class="role-editor-section">
          <div class="permission-subhead custom-rule-head">
            <div>
              <b>登录日志</b>
              <small>查看该用户最近登录结果、IP、设备和入口，便于追溯账号使用情况。</small>
            </div>
            <div class="segmented compact-segmented">
              <button type="button" :class="{ active: userWorkspace.loginFilter === 'all' }" @click="userWorkspace.loginFilter = 'all'">全部</button>
              <button type="button" :class="{ active: userWorkspace.loginFilter === 'success' }" @click="userWorkspace.loginFilter = 'success'">成功</button>
              <button type="button" :class="{ active: userWorkspace.loginFilter === 'failed' }" @click="userWorkspace.loginFilter = 'failed'">失败</button>
            </div>
          </div>
          <table v-if="filteredUserLoginLogs.length" class="permission-table user-login-table">
            <thead><tr><th>登录时间</th><th>结果</th><th>IP / 设备</th><th>入口</th><th>失败原因</th></tr></thead>
            <tbody>
              <tr v-for="log in filteredUserLoginLogs" :key="log.time + log.ip">
                <td>{{ log.time }}</td>
                <td><span :class="['table-status', log.result === 'success' ? 'done' : 'rejected']">{{ log.result === 'success' ? '成功' : '失败' }}</span></td>
                <td>{{ log.ip }} / {{ log.device }}</td>
                <td>{{ log.entry }}</td>
                <td>{{ log.failureReason || '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="scope-empty compact-empty"><b>暂无登录日志</b><p>当前筛选条件下没有登录记录，请切换为“全部”后再查看。</p></div>
        </section>

        <div class="modal-actions sticky-actions">
          <span v-if="userWorkspace.notice" class="approval-feedback">{{ userWorkspace.notice }}</span>
          <button type="button" class="ghost-btn" @click="closeUserWorkspace">{{ userWorkspace.mode === 'view' ? '关闭' : '取消' }}</button>
          <button v-if="userWorkspace.mode === 'view'" type="button" class="primary-btn" @click="switchUserWorkspaceToEdit">进入编辑</button>
          <button v-else type="button" class="primary-btn" @click="saveUserWorkspace">{{ userWorkspaceSaveLabel }}</button>
        </div>
      </div>
    </div>

    <PermissionRolePickerModal
      :visible="userRoleModal.visible"
      :roles="filteredUserRoleOptions"
      :detail-role="userRoleModalDetailRole"
      :permission-groups="filteredRolePermissionGroups(userRoleModalDetailRole, userRoleModal.activePermissionTab, userRoleModal.detailKeyword)"
      :keyword="userRoleModal.keyword"
      :detail-keyword="userRoleModal.detailKeyword"
      :active-permission-tab="userRoleModal.activePermissionTab"
      :selected-role-ids="userRoleModal.selectedIds"
      :selected-function-ids="userRoleModal.selectedFunctionIds"
      :selected-data-ids="userRoleModal.selectedDataIds"
      :locked-role-ids="[]"
      :conflicts="userRoleModalConflicts"
      @close="closeUserRoleModal"
      @confirm="confirmUserRoleSelection"
      @open-detail="openUserRoleDetail"
      @close-detail="closeUserRoleDetail"
      @toggle-role="toggleUserRoleSelection"
      @toggle-function="toggleUserRoleModalFunctionPermission"
      @toggle-data="toggleUserRoleModalDataPermission"
      @update:keyword="userRoleModal.keyword = $event; syncUserRoleModalDetailWithResults()"
      @update:detail-keyword="userRoleModal.detailKeyword = $event"
      @update:active-permission-tab="userRoleModal.activePermissionTab = $event"
    />
    <div v-if="userStatusConfirm.visible && statusTargetUser" class="permission-modal" @click.self="closeUserStatusConfirm">
      <div class="modal-panel status-confirm-modal direct-status-modal">
        <button type="button" class="modal-close" @click="closeUserStatusConfirm">×</button>
        <div class="role-editor-head">
          <div>
            <h3>确认{{ userStatusConfirm.action === 'disable' ? '禁用' : '启用' }}账号</h3>
            <p>该操作由系统管理员直接执行，不生成审批申请。</p>
          </div>
          <span class="table-status" :class="userStatusConfirm.action === 'disable' ? 'rejected' : 'done'">管理员直接操作</span>
        </div>
        <div class="direct-status-summary">
          <div><span>用户</span><b>{{ statusTargetUser.name }}</b></div>
          <div><span>账号</span><b>{{ statusTargetUser.loginAccount }}</b></div>
          <div><span>当前状态</span><b>{{ userStatusLabel(statusTargetUser) }}</b></div>
        </div>
        <label class="direct-status-reason">
          <span class="field-label required">操作原因 <em>必填</em></span>
          <textarea v-model.trim="userStatusConfirm.reason" :class="{ invalid: userStatusConfirm.error }" rows="4" :placeholder="userStatusConfirm.action === 'disable' ? '请说明禁用原因，便于后续审计追溯。' : '请说明启用原因，便于后续审计追溯。'"></textarea>
          <small v-if="userStatusConfirm.error" class="field-error">{{ userStatusConfirm.error }}</small>
        </label>
        <div class="modal-actions sticky-actions">
          <button type="button" class="ghost-btn" @click="closeUserStatusConfirm">取消</button>
          <button type="button" :class="userStatusConfirm.action === 'disable' ? 'danger-btn' : 'primary-btn'" @click="confirmUserStatusChange">确认{{ userStatusConfirm.action === 'disable' ? '禁用' : '启用' }}</button>
        </div>
      </div>
    </div>

    <div v-if="organizationEditor.visible" class="permission-modal" @click.self="closeOrganizationEditor">
      <div class="modal-panel org-editor-modal">
        <button type="button" class="modal-close" @click="closeOrganizationEditor">×</button>
        <h3>{{ organizationEditor.mode === 'create' ? '新增组织' : '编辑组织信息' }}</h3>
        <p class="modal-note">维护组织归属、名称、负责人和描述。保存后会立即更新当前 POC 展示数据。</p>
        <div class="org-form-grid">
          <label>
            <span class="field-label required">Tenant <em>必填</em></span>
            <select v-model="organizationEditor.draft.tenant" :class="{ invalid: organizationEditor.errors.tenant }">
              <option disabled value="">请选择 Tenant</option>
              <option v-for="tenant in organizationTenants" :key="tenant.value" :value="tenant.value">{{ tenant.label }}</option>
            </select>
            <small v-if="organizationEditor.errors.tenant" class="field-error">{{ organizationEditor.errors.tenant }}</small>
          </label>
          <label>
            <span class="field-label required">组织名称 <em>必填</em></span>
            <input v-model.trim="organizationEditor.draft.name" :class="{ invalid: organizationEditor.errors.name }" placeholder="请输入组织名称">
            <small v-if="organizationEditor.errors.name" class="field-error">{{ organizationEditor.errors.name }}</small>
          </label>
          <label>
            <span :class="['field-label', { required: organizationEditor.mode === 'create' }]">上级组织 <em v-if="organizationEditor.mode === 'create'">必填</em></span>
            <select v-model="organizationEditor.draft.parentId" :disabled="organizationEditor.mode === 'edit'" :class="{ invalid: organizationEditor.errors.parentId }">
              <option disabled value="">请选择上级组织</option>
              <option v-for="org in organizationParentOptions" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
            <small v-if="organizationEditor.errors.parentId" class="field-error">{{ organizationEditor.errors.parentId }}</small>
          </label>
          <label>
            <span>负责人</span>
            <input v-model.trim="organizationEditor.draft.owner" placeholder="请输入负责人账号或姓名">
          </label>
          <label>
            <span>创建人</span>
            <input v-model.trim="organizationEditor.draft.creator" placeholder="请输入创建人账号或姓名">
          </label>
          <label>
            <span>Code</span>
            <input v-model.trim="organizationEditor.draft.code" :readonly="organizationEditor.mode === 'edit'" :class="{ invalid: organizationEditor.errors.code }" placeholder="例如 OPS-MALL">
            <small v-if="organizationEditor.errors.code" class="field-error">{{ organizationEditor.errors.code }}</small>
          </label>
          <label class="full">
            <span>组织描述 <em>{{ organizationEditor.draft.description.length }}/120</em></span>
            <textarea v-model.trim="organizationEditor.draft.description" :class="{ invalid: organizationEditor.errors.description }" rows="4" placeholder="请说明该组织负责的业务范围、成员边界和权限使用场景。"></textarea>
            <small v-if="organizationEditor.errors.description" class="field-error">{{ organizationEditor.errors.description }}</small>
            <small v-else class="field-help">建议控制在 120 字以内，便于审批人快速理解。</small>
          </label>
        </div>
        <div class="modal-actions">
          <span v-if="organizationEditor.notice" class="approval-feedback">{{ organizationEditor.notice }}</span>
          <button type="button" class="ghost-btn" @click="closeOrganizationEditor">取消</button>
          <button type="button" class="primary-btn" @click="saveOrganizationEditor">保存</button>
        </div>
      </div>
    </div>

    <div v-if="organizationMemberModal.visible" class="permission-modal" @click.self="closeOrganizationMemberModal">
      <div class="modal-panel org-editor-modal">
        <button type="button" class="modal-close" @click="closeOrganizationMemberModal">×</button>
        <h3>{{ organizationMemberModal.mode === 'edit' ? '编辑组织成员' : '添加组织成员' }}</h3>
        <p class="modal-note">{{ organizationMemberModal.mode === 'edit' ? '调整成员基础信息和组织角色，保存后立即更新成员列表。' : '成员会添加到当前选中的组织，并同步更新成员数量。' }}</p>
        <div class="org-form-grid">
          <label>
            <span>所属组织</span>
            <select v-model="organizationMemberModal.draft.organizationId">
              <option v-for="org in flatOrganizations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
          </label>
          <label>
            <span class="field-label required">姓名 <em>必填</em></span>
            <input v-model.trim="organizationMemberModal.draft.name" :class="{ invalid: organizationMemberModal.errors.name }" placeholder="请输入成员姓名">
            <small v-if="organizationMemberModal.errors.name" class="field-error">{{ organizationMemberModal.errors.name }}</small>
          </label>
          <label>
            <span class="field-label required">账号 <em>必填</em></span>
            <input v-model.trim="organizationMemberModal.draft.account" :class="{ invalid: organizationMemberModal.errors.account }" placeholder="请输入 ITCode 或登录账号">
            <small v-if="organizationMemberModal.errors.account" class="field-error">{{ organizationMemberModal.errors.account }}</small>
          </label>
          <label>
            <span>部门</span>
            <input v-model.trim="organizationMemberModal.draft.department" placeholder="例如：乐享运营">
          </label>
          <label>
            <span>组织角色</span>
            <select v-model="organizationMemberModal.draft.orgRole">
              <option>负责人</option>
              <option>管理员</option>
              <option>成员</option>
              <option>协作人</option>
            </select>
          </label>
        </div>
        <div class="modal-actions">
          <span v-if="organizationMemberModal.notice" class="approval-feedback">{{ organizationMemberModal.notice }}</span>
          <button type="button" class="ghost-btn" @click="closeOrganizationMemberModal">取消</button>
          <button type="button" class="primary-btn" @click="saveOrganizationMember">{{ organizationMemberModal.mode === 'edit' ? '保存' : '确认添加' }}</button>
        </div>
      </div>
    </div>

    <div v-if="detailModal.visible" class="permission-modal" @click.self="closeDetailModal">
      <div class="modal-panel">
        <button type="button" class="modal-close" @click="closeDetailModal">×</button>
        <h3>{{ detailModal.title }}</h3>
        <dl class="detail-list">
          <template v-for="(value, key) in detailModal.data" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
        </dl>
      </div>
    </div>

    <div v-if="recordModalVisible" class="permission-modal" @click.self="recordModalVisible = false">
      <div class="modal-panel">
        <button type="button" class="modal-close" @click="recordModalVisible = false">×</button>
        <h3>权限管理 POC 记录</h3>
        <p class="modal-note">仅用于 POC 记录，按功能点归纳，不作为正式审计依据。</p>
        <div class="record-list">
          <article v-for="record in records" :key="record.time + record.title">
            <time>{{ record.time }}</time>
            <b>{{ record.title }}</b>
            <p>{{ record.detail }}</p>
            <span>{{ record.status }}</span>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { vPermissionDialogFooter } from '../../components/permissions/permissionDialogFooter'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MENU_TREE } from '@/stores/app'
import ContentPageHeader from '@/components/content/ContentPageHeader.vue'
import SectionHeader from '@/components/content/SectionHeader.vue'
import PermissionCopyRoleModal from '@/components/permissions/PermissionCopyRoleModal.vue'
import CustomTableAuthorizationEditor from '@/components/permissions/CustomTableAuthorizationEditor.vue'
import PermissionDataDirectoryList from '@/components/permissions/PermissionDataDirectoryList.vue'
import PermissionDataPickerModal from '@/components/permissions/PermissionDataPickerModal.vue'
import PermissionScopeEditor from '@/components/permissions/PermissionScopeEditor.vue'
import BusinessApproverField from '@/components/permissions/BusinessApproverField.vue'
import { BUSINESS_APPROVER_GROUPS, businessApproverError, businessApproverLabel, createSelectedBusinessApprovalTasks } from '@/components/permissions/businessApprovers.js'
import { createPermissionDataSources, createPermissionScopeCatalog, groupDataPermissionsByDirectory, groupPermissionCatalog } from '@/components/permissions/permissionScopeCatalog'
import { permissionScopeDiff, permissionScopeValidation, resolvePermissionScopeFunctionIds } from '@/components/permissions/permissionScopeSnapshot.js'
import { APPLICATION_INFO_FIELD, resolveApplicationInfoSchema, schemaHasField, schemaRequiresField } from '@/components/permissions/applicationInfoSchema.js'
import PermissionRolePickerModal from '@/components/permissions/PermissionRolePickerModal.vue'
import { createPermissionDemoRouteItems } from '@/utils/permissionDemoRoute.js'
import { customRulesSignature, normalizeCustomDataRules, validateCustomTableRules } from '@/components/permissions/customTableAuthorization.js'
import { detectCustomDataRoleConflicts } from '@/components/permissions/customDataRoleConflict.js'

const router = useRouter()

const modules = [
  { key: 'apply', label: '权限申请', icon: 'AP', desc: '申请链路', fullDesc: '按类型发起权限变更、创建账号、启用账号、禁用账号和重置密码。' },
  { key: 'approval', label: '审批列表', icon: 'OK', desc: '待办处理', fullDesc: '集中处理直线经理与后台执行相关待办。' },
  { key: 'roles', label: '角色管理', icon: 'RL', desc: '角色范围', fullDesc: '维护角色、菜单范围、数据范围和成员绑定。' },
  { key: 'users', label: '用户管理', icon: 'US', desc: '账号与角色', fullDesc: '查看用户账号、角色、角色之外的额外权限和历史变更。' },
  {
    key: 'orgs',
    label: '组织管理',
    icon: 'OR',
    desc: '组织架构',
    fullDesc: '维护组织架构、组织描述和成员关系。',
    items: [
      { code: 'L1', name: '联想乐享', desc: '联想门户工作台业务根组织。', status: '启用', owner: 'admin' },
      { code: 'OP', name: '乐享运营', desc: '运营看板、活动和商品配置团队。', status: '启用', owner: 'sunll1' },
      { code: 'GEO', name: 'GEO 看板', desc: '搜索与信源监测团队。', status: '启用', owner: 'zhangjq4' }
    ]
  },
  {
    key: 'datasource',
    label: '数据源管理',
    icon: 'DB',
    desc: '数据权限',
    fullDesc: '维护普通和自定义数据权限，支持字段级范围配置。',
    items: [
      { code: 'DS', name: '运营数据集', desc: 'GMV、流量、转化、Query 等指标。', status: '可用', owner: '数据平台' },
      { code: 'MEM', name: '会员标签库', desc: '会员分层、权益使用和画像标签。', status: '可用', owner: '会员中心' },
      { code: 'GEO', name: 'GEO 信源库', desc: '官方、社区和引用信源。', status: '校验中', owner: '搜索后台' }
    ]
  },
  {
    key: 'functions',
    label: '菜单管理',
    icon: 'FN',
    desc: '菜单功能',
    fullDesc: '维护菜单权限、功能点和按钮级能力。',
    items: [
      { code: 'MENU', name: '联想门户工作台', desc: '工作台首页、固定页签和 Agent 入口。', status: '启用', owner: '平台组' },
      { code: 'SKILL', name: 'Skill Hub', desc: 'Skill 创建、评估、审批、发布和测试。', status: '启用', owner: 'AI 平台' },
      { code: 'LEAD', name: '企业客户管理', desc: '线索看板、线索池、打分模型。', status: '启用', owner: '企业客户组' }
    ]
  }
]

const moduleGroups = [
  { key: 'workflow', label: '流程处理', moduleKeys: ['apply', 'approval'] },
  { key: 'configuration', label: '权限配置', moduleKeys: ['roles', 'users', 'orgs', 'datasource', 'functions'] }
].map((group) => ({
  ...group,
  items: modules.filter((item) => group.moduleKeys.includes(item.key))
}))
const moduleSearchKeyword = ref('')
const filteredModuleGroups = computed(() => {
  const keyword = moduleSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return moduleGroups
  return moduleGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => `${item.label} ${item.desc}`.toLowerCase().includes(keyword))
    }))
    .filter((group) => group.items.length)
})

const route = useRoute()
const activeModule = ref('apply')
const currentStep = ref(0)
const maxReachableStep = ref(0)
const applySubmitNotice = ref('')
const recordModalVisible = ref(false)

const fullApplySteps = [
  { key: 'type', label: '1. 选择类型' },
  { key: 'info', label: '2. 填写信息' },
  { key: 'scope', label: '3. 权限范围' },
  { key: 'approve', label: '4. 审批执行' }
]

const accountStatusApplySteps = [
  { key: 'type', label: '1. 选择类型' },
  { key: 'info', label: '2. 填写信息' },
  { key: 'approve', label: '3. 审批执行' }
]

const accountCreateApplySteps = [
  { key: 'type', label: '1. 选择类型' },
  { key: 'info', label: '2. 填写信息' },
  { key: 'approve', label: '3. 审批执行' }
]

const passwordResetApplySteps = [
  { key: 'type', label: '1. 选择类型' },
  { key: 'verify', label: '2. 身份验证' },
  { key: 'done', label: '3. 重置完成' }
]

const requestTypes = [
  { key: 'change', no: '01', label: '权限变更', summary: '已有账号新增或调整菜单、功能、数据和 Skill 权限。', route: '必要关系确认 + 直线经理 + 全部业务负责人' },
  { key: 'create', no: '02', label: '创建账号', summary: '关联人为外部协作人员创建账号并同步申请权限。', route: '申请人直线经理 + 全部业务负责人' },
  { key: 'enable', no: '03', label: '启用账号', summary: '恢复已停用账号的登录和业务操作能力。', route: '系统管理员审批' },
  { key: 'disable', no: '04', label: '禁用账号', summary: '关闭账号登录、导出、发布和后台操作权限。', route: '系统管理员审批' },
  { key: 'reset', no: '05', label: '重置密码', summary: '当前用户自助修改密码，支持旧密码或手机号/邮箱验证。', route: '自助验证，无需审批' }
]

const personTypes = [
  { key: 'internal', label: '内部人员', desc: '联想内部员工或已有正式账号人员。' },
  { key: 'external', label: '外部人员', desc: '供应商、外包或临时协作人员，需填写关联人员。' }
]

const form = reactive({
  type: 'change',
  applicantPersonType: 'internal',
  personType: 'internal',
  applicant: 'admin',
  itcode: 'admin',
  targetUser: '',
  targetItcode: 'zhangrui32',
  relatedAccount: '',
  accountPassword: '',
  confirmAccountPassword: '',
  mobile: '',
  email: '',
  applicantManager: 'sunll1',
  targetManager: 'wangxt8',
  businessApprover: '',
  tenant: ['leaibot-cn'],
  systemApprover: 'sunzh4',
  reason: '需要联动运营看板、商品管理和 Skill Hub 进行日常数据查询、报告生成和配置确认。',
  relation: {
    contact: '关联人 C 已确认',
    org: '乐享运营',
    role: '运营分析 PM',
    data: '运营数据集 / 华东区',
    skill: '经营指标解读、内容发布检查'
  },
  scopes: {
    account: []
  }
})

const formErrors = reactive({
  targetUser: '',
  targetItcode: '',
  relatedAccount: '',
  accountPassword: '',
  confirmAccountPassword: '',
  targetManager: '',
  reason: '',
  tenant: '',
  businessApprover: ''
})
const passwordReset = reactive({
  mode: 'old-password',
  oldPassword: '',
  mobile: '13800000000',
  email: 'admin@lenovo.com',
  verifyCode: '',
  newPassword: '',
  confirmPassword: '',
  completed: false,
  completedAt: '',
  errors: {
    oldPassword: '',
    contact: '',
    verifyCode: '',
    newPassword: '',
    confirmPassword: ''
  }
})

const businessApprovers = BUSINESS_APPROVER_GROUPS.flatMap((group) => group.options.map((option) => option.label))

function portalGroupLabel(groupKey, fallback) {
  return MENU_TREE[groupKey]?.label || fallback
}

function portalPageLabel(pageId, fallback) {
  for (const group of Object.values(MENU_TREE)) {
    const page = group.children?.[pageId]
    if (page?.label) return page.label
  }
  return fallback
}
function customPermissionId(prefix, value) {
  const text = String(value || '').trim().toLowerCase()
  const ascii = text.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
  return `${prefix}.${ascii || Date.now()}`
}

const permissionScopeCatalog = createPermissionScopeCatalog()
const allFunctionPermissions = permissionScopeCatalog.functionPermissions
const functionPermissionTree = groupPermissionCatalog(permissionScopeCatalog.functionPermissions)
const dataPermissionTree = reactive(groupPermissionCatalog(permissionScopeCatalog.dataPermissions))
const allRoles = reactive([
  {
    id: 'ops-pm',
    code: 'PM',
    name: '运营分析 PM',
    type: '普通角色',
    group: '乐享运营',
    desc: '可查看运营总览、生成报告，并使用常用运营数据。',
    owner: 'zhangjq4',
    sensitivity: 'sensitive-data',
    users: 12,
    systemRole: false,
    updatedAt: '2026-07-13 18:20',
    functionPermissionIds: ['func.dashboard.view', 'func.report.generate', 'func.data.export'],
    dataPermissionIds: [],
    functionPermissionNotes: {
      'func.data.export': '仅用于运营日报和复盘导出。'
    },
    dataPermissionNotes: {},
    customDataRules: [
      { id: 'rule-ops-east-quarter', dataset: '运营数据集', fields: 'GMV、流量、转化', organization: '乐享运营', region: '华东区', period: '2026-07-01 至 2026-09-30', remark: '季度活动复盘临时授权。' }
    ]
  },
  {
    id: 'product-op',
    code: 'OP',
    name: '商品运营',
    type: '普通角色',
    group: '商品中心',
    desc: '可配置商品、推荐位、价格和上下架策略。',
    owner: 'huangjq5',
    sensitivity: 'sensitive-action',
    users: 26,
    systemRole: false,
    updatedAt: '2026-07-12 16:08',
    functionPermissionIds: ['func.dashboard.view', 'func.product.config', 'func.publish.confirm'],
    dataPermissionIds: ['data.ops.region.north', 'data.ops.metric.gmv'],
    functionPermissionNotes: {
      'func.publish.confirm': '涉及发布前复核。'
    },
    dataPermissionNotes: {},
    customDataRules: []
  },
  {
    id: 'geo-analyst',
    code: 'GEO',
    name: 'GEO 分析师',
    type: '普通角色',
    group: '搜索后台',
    desc: '可查看信源、引用和搜索表现数据。',
    owner: 'zhangxy43',
    sensitivity: 'sensitive-data',
    users: 8,
    systemRole: false,
    updatedAt: '2026-07-11 14:30',
    functionPermissionIds: ['func.geo.monitor', 'func.report.generate'],
    dataPermissionIds: ['data.geo.source.official', 'data.geo.source.community'],
    functionPermissionNotes: {},
    dataPermissionNotes: {
      'data.geo.source.community': '仅用于趋势分析，不包含用户身份。'
    },
    customDataRules: []
  },
  {
    id: 'lead-operator',
    code: 'LEAD',
    name: '线索运营',
    type: '普通角色',
    group: '企业客户管理',
    desc: '可查看企业客户线索并进行分配跟进。',
    owner: 'sunll1',
    sensitivity: 'sensitive-action',
    users: 15,
    systemRole: false,
    updatedAt: '2026-07-10 11:42',
    functionPermissionIds: ['func.lead.assign', 'func.data.export'],
    dataPermissionIds: [],
    functionPermissionNotes: {},
    dataPermissionNotes: {},
    customDataRules: [
      { id: 'rule-lead-north', dataset: '企业客户线索', fields: '客户名称、意向等级、跟进状态', organization: '企业客户管理', region: '华北区', period: '长期有效', remark: '仅线索分配岗位可见。' }
    ]
  },
  {
    id: 'admin',
    code: 'ADMIN',
    name: 'admin',
    type: '角色管理员',
    group: '系统管理',
    desc: '用于 mock 管理员账号，覆盖权限申请、审批、用户、组织、数据源、功能配置和审计类能力。',
    owner: 'admin',
    sensitivity: 'it-config-data',
    users: 2,
    systemRole: true,
    updatedAt: '2026-07-22 10:35',
    functionPermissionIds: ['func.dashboard.view', 'func.report.generate', 'func.data.export', 'func.product.config', 'func.publish.confirm', 'func.skill.manage', 'func.geo.monitor', 'func.lead.assign'],
    dataPermissionIds: ['data.ops.region.east', 'data.ops.region.north', 'data.ops.region.south', 'data.ops.metric.gmv', 'data.ops.metric.flow', 'data.member.profile.level', 'data.member.profile.rights', 'data.geo.source.official', 'data.geo.source.community', 'data.lead.pool.all', 'data.lead.pool.assigned'],
    functionPermissionNotes: {
      'func.data.export': '管理员可导出权限审计和运营排查所需数据。',
      'func.skill.manage': '管理员可配置 Skill、菜单和后台能力开关。',
      'func.lead.assign': '管理员可在紧急情况下协助线索权限修复。'
    },
    dataPermissionNotes: {
      'data.lead.pool.all': '仅用于权限排障和审计回溯。',
      'data.member.profile.rights': '涉及会员权益明细，默认作为高敏数据展示。'
    },
    customDataRules: [
      {
        id: 'admin-product-ai',
        menuKey: 'product-ai',
        menuName: '商品AI助手',
        groups: [
          { id: 'admin-product-ai-consumer', relation: '', title: '消费业务全量', conditions: [
            { id: 'admin-product-ai-consumer-business', dimension: '业务', operator: '包含', values: ['消费业务', 'SMB业务'] },
            { id: 'admin-product-ai-consumer-fa', dimension: 'FA', operator: '包含', values: ['FA01', 'FA02', 'SMBFA01', 'SMBFA02'] }
          ] },
          { id: 'admin-product-ai-publish', relation: 'OR', title: '发布与商品配置', conditions: [
            { id: 'admin-product-ai-publish-business', dimension: '业务', operator: '包含', values: ['商品运营'] },
            { id: 'admin-product-ai-publish-region', dimension: '地域', operator: '包含', values: ['全国'] }
          ] }
        ]
      },
      {
        id: 'admin-data-ai',
        menuKey: 'data-ai',
        menuName: '数据AI助手',
        groups: [
          { id: 'admin-data-ai-chat', relation: '', title: '数据来源：Chat', conditions: [
            { id: 'admin-data-ai-chat-source', dimension: '数据来源', operator: '包含', values: ['Chat'] },
            { id: 'admin-data-ai-chat-category', dimension: '一级品类', operator: '包含', values: ['消费PC', 'SMB'] }
          ] },
          { id: 'admin-data-ai-report', relation: 'OR', title: '数据来源：报表', conditions: [
            { id: 'admin-data-ai-report-source', dimension: '数据来源', operator: '包含', values: ['报表'] },
            { id: 'admin-data-ai-report-field', dimension: '字段', operator: '包含', values: ['GMV', '流量', '转化', '线索状态'] }
          ] }
        ]
      }
    ]
  },  {
    id: 'bpo-collab',
    code: 'BPO',
    name: '外包协作',
    type: '普通角色',
    group: '外部协作',
    desc: '受限菜单和脱敏数据，仅保留必要操作。',
    owner: 'wangxt8',
    sensitivity: 'standard-data',
    users: 34,
    systemRole: true,
    updatedAt: '2026-07-09 09:18',
    functionPermissionIds: ['func.dashboard.view'],
    dataPermissionIds: ['data.ops.region.south'],
    functionPermissionNotes: {},
    dataPermissionNotes: {
      'data.ops.region.south': '仅展示脱敏汇总。'
    },
    customDataRules: []
  }
])
const permissionScopeRoleMap = new Map(permissionScopeCatalog.roles.map((role) => [role.id, role]))
allRoles.forEach((role) => {
  const scopeRole = permissionScopeRoleMap.get(role.id)
  if (!scopeRole) return
  Object.assign(role, {
    name: scopeRole.name,
    desc: scopeRole.description,
    owner: scopeRole.owner,
    functionPermissionIds: [...scopeRole.functionPermissionIds],
    dataPermissionIds: [...scopeRole.dataPermissionIds]
  })
})
const copyableUsers = permissionScopeCatalog.copyableUsers

const selectedRoleIds = ref([])
const copiedRoleIds = ref([])
const selectedFunctionPermissionIds = ref([])
const selectedDataPermissionIds = ref([])
const manualDataPermissionIds = ref([])
const copiedDataSourceMap = reactive({})
const copiedFromItcode = ref('')

const roleModal = reactive({
  visible: false,
  keyword: '',
  selectedIds: [],
  selectedFunctionIds: [],
  selectedDataIds: [],
  detailRoleId: '',
  detailKeyword: '',
  activePermissionTab: 'function'
})

const roleCardDetail = reactive({
  visible: false,
  roleId: '',
  keyword: '',
  activePermissionTab: 'function',
  context: 'application'
})
const copyModal = reactive({
  visible: false,
  itcode: '',
  error: ''
})

const dataModal = reactive({
  visible: false,
  selectedIds: []
})

const legacyDataSourceGroupMenuMap = {
  乐享运营: '乐享运营',
  会员中心: '在职员工管理',
  'GEO 看板': 'GEO 看板',
  企业客户管理: '企业客户管理',
  商城运营: '乐享运营'
}
const dataSourceSensitivityOptions = [
  { value: 'standard-data', label: '标准数据（低风险）' },
  { value: 'standard-action', label: '标准操作（低风险）' },
  { value: 'sensitive-data', label: '敏感数据（中风险）' },
  { value: 'sensitive-action', label: '敏感操作（中风险）' },
  { value: 'it-config-data', label: 'IT 配置数据（高风险）' }
]
const dataSources = reactive(createPermissionDataSources())
const dataSourceNotice = ref('')
let dataSourceNoticeTimer = null
const selectedDataSourceId = ref('')
const dataSourceDetailVisible = ref(false)
const dataSourceFilters = reactive({ menu: '', name: '', sensitivity: '' })
const emptyDataSourceDraft = () => ({ id: '', group: '', menu: '', name: '', apiUrl: '', permissionParam: '', key: '', value: '', remark: '', sensitivity: 'sensitive-data' })
const dataSourceEditor = reactive({
  visible: false,
  mode: 'create',
  sourceId: '',
  draft: emptyDataSourceDraft(),
  menuPickerOpen: false,
  menuRootId: '',
  errors: { menu: '', name: '', apiUrl: '', permissionParam: '', remark: '' },
  notice: ''
})

const functionTypeOptions = [
  { value: 'function', label: '功能' },
  { value: 'button', label: '按钮' },
  { value: 'skill', label: 'Skill' }
]

function createFunctionMenuTreeFromNavigation() {
  return Object.entries(MENU_TREE).map(([groupKey, group]) => ({
    id: groupKey,
    name: group.label,
    path: '',
    code: `menu.${groupKey}`,
    nodeType: 'directory',
    children: Object.entries(group.children || {}).map(([pageId, page], index) => ({
      id: pageId,
      name: page.label,
      path: page.path,
      code: pageId,
      order: index + 1,
      status: 'enabled',
      description: `${group.label}下的${page.label}页面`,
      nodeType: 'menu',
      children: []
    }))
  }))
}

const functionMenuTree = reactive(createFunctionMenuTreeFromNavigation())
const functionInterfaceCatalog = [
  { id: 'api-ops-dashboard', name: '运营总览查询', url: '/api/ops/dashboard' },
  { id: 'api-report-generate', name: '报告生成任务', url: '/api/report/generate' },
  { id: 'api-data-export', name: '数据导出任务', url: '/api/export/tasks' },
  { id: 'api-product-config', name: '商品配置保存', url: '/api/product/config' },
  { id: 'api-publish-confirm', name: '发布确认提交', url: '/api/publish/confirm' },
  { id: 'api-skill-manage', name: 'Skill 管理接口', url: '/api/skill/manage' },
  { id: 'api-geo-monitor', name: 'GEO 信源监测', url: '/api/geo/monitor' },
  { id: 'api-lead-assign', name: '线索分配接口', url: '/api/leads/assign' }
]

const managedFunctions = reactive([
  {
    id: 'func.dashboard.view',
    menu: '乐享运营 / 运营总览',
    name: '查看运营总览',
    description: '允许用户进入运营总览页面，查看核心经营指标和常用运营入口。',
    type: 'function',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[0] }]
  },
  {
    id: 'func.report.generate',
    menu: '乐享运营 / 质量分析',
    name: '报告生成',
    description: '允许用户基于运营数据生成日报、复盘报告和业务分析材料。',
    type: 'function',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[1] }]
  },
  {
    id: 'func.data.export',
    menu: '乐享运营 / GMV 分析',
    name: '数据导出',
    description: '允许用户在已授权数据范围内导出运营、线索或看板明细。',
    type: 'button',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[2] }]
  },
  {
    id: 'func.product.config',
    menu: '乐享运营 / 运营总览',
    name: '商品配置',
    description: '允许商品运营维护商品、推荐位、价格和活动配置。',
    type: 'function',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[3] }]
  },
  {
    id: 'func.publish.confirm',
    menu: '乐享运营 / Query 分析',
    name: '发布确认',
    description: '允许负责人在发布前完成配置复核和确认提交。',
    type: 'button',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[4] }]
  },
  {
    id: 'func.skill.manage',
    menu: '在职员工管理 / 职场员工审核',
    name: 'Skill 管理',
    description: '允许用户创建、编辑、评估和发布 Skill。',
    type: 'skill',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[5] }]
  },
  {
    id: 'func.geo.monitor',
    menu: 'GEO 看板 / 各平台信源分布',
    name: 'GEO 信源监测',
    description: '允许用户查看 GEO 信源引用、平台表现和趋势监测数据。',
    type: 'function',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[6] }]
  },
  {
    id: 'func.lead.assign',
    menu: '企业客户管理 / 线索池',
    name: '线索分配',
    description: '允许企业客户运营将线索分配给对应跟进人员。',
    type: 'button',
    status: 'enabled',
    interfaces: [{ ...functionInterfaceCatalog[7] }]
  }
])

const selectedFunctionId = ref('func.dashboard.view')
const functionDetailVisible = ref(false)
const functionNotice = ref('')
let functionNoticeTimer = null
const functionFilters = reactive({ name: '', root: '', menu: '', type: '' })
const functionCreateTab = ref('function')
const collapsedFunctionTreeIds = ref(new Set())
const expandedFunctionMenuIds = ref(new Set())
const collapsedDataSourceTreeIds = ref(new Set())
const emptyFunctionDirectoryDraft = () => ({ parentId: '__root__', name: '', path: '', order: 10, description: '' })
const functionDirectoryEditor = reactive({
  mode: 'create',
  targetId: '',
  draft: emptyFunctionDirectoryDraft(),
  errors: { parentId: '', name: '', path: '', order: '', description: '' },
  notice: ''
})
const emptyFunctionDraft = () => ({ id: '', menu: '', name: '', description: '', type: 'function', status: 'enabled', interfaces: [emptyFunctionInterfaceDraft()] })
const functionEditor = reactive({
  visible: false,
  mode: 'create',
  functionId: '',
  draft: emptyFunctionDraft(),
  errors: { menu: '', name: '', description: '', type: '', interfaces: '' },
  notice: ''
})
const emptyFunctionMenuDraft = () => ({ rootId: '', parentId: '', name: '', path: '', code: '', order: 10, status: 'enabled', description: '' })
const functionMenuEditor = reactive({
  visible: false,
  mode: 'create',
  targetId: '',
  draft: emptyFunctionMenuDraft(),
  errors: { rootId: '', parentId: '', name: '', path: '', code: '', order: '', description: '' },
  notice: ''
})
const relationCards = computed(() => [
  { key: 'org', label: '组织', icon: 'O', value: form.relation.org },
  { key: 'role', label: '角色', icon: 'R', value: form.relation.role },
  { key: 'data', label: '数据范围', icon: 'D', value: form.relation.data },
  { key: 'skill', label: 'Skill 范围', icon: 'S', value: form.relation.skill }
])

const pickerOptions = {
  org: ['乐享运营', 'GEO 看板', '企业客户管理', '搜索后台'],
  role: ['运营分析 PM', '商品运营', '数据分析师', '客服运营'],
  data: ['运营数据集 / 全国', '运营数据集 / 华东区', 'GEO 信源库 / 只读', '会员标签库 / 脱敏'],
  skill: ['经营指标解读、内容发布检查', '商品配置助手、链接巡检', '会员分层洞察、认证失败导出']
}

const picker = reactive({
  visible: false,
  key: '',
  title: '',
  options: []
})

const detailModal = reactive({
  visible: false,
  title: '',
  data: {}
})

const approvalFilters = ['全部', '审批中', '已完成', '已驳回']
const demoIdentityOptions = [
  { key: 'admin', label: '管理员', viewer: 'approver', approverItcode: '', nodeTypes: [] },
  { key: 'requester', label: '申请人/被申请人', viewer: 'applicant', approverItcode: '', nodeTypes: [] },
  { key: 'relation', label: '关联人', viewer: 'approver', approverItcode: 'wangxt8', nodeTypes: ['relation'] },
  { key: 'applicant-manager', label: '申请人直线经理', viewer: 'approver', approverItcode: 'sunll1', nodeTypes: ['applicant-manager'] },
  { key: 'target-manager', label: '被申请人直线经理', viewer: 'approver', approverItcode: 'wangxt8', nodeTypes: ['target-manager'] },
  { key: 'business-owner', label: '业务负责人', viewer: 'approver', approverItcode: 'zhangjq4', nodeTypes: ['business'] },
  { key: 'system-admin', label: '系统管理员', viewer: 'approver', approverItcode: 'sunzh4', nodeTypes: ['system-admin'] }
]
const organizationOptions = ['乐享运营', '平台运营', '商用业务运营', '系统管理', '外部协作', 'GEO 看板', '企业客户管理', '搜索后台']
const tenantOptions = permissionScopeCatalog.tenantOptions
const demoIdentityKey = ref('admin')
const demoIdentityMenuOpen = ref(false)
const currentDemoIdentity = computed(() => demoIdentityOptions.find((item) => item.key === demoIdentityKey.value) || demoIdentityOptions[0])
const approvalMailRoleContext = ref('')
const approvalDeepLinkTicket = ref('')
const approvalSearch = reactive({
  status: '全部',
  approverItcode: '',
  viewer: 'approver',
  handlerDraft: '',
  handlerFocused: false,
  handlers: []
})
const approvalWorkspace = reactive({
  visible: false,
  mode: 'view',
  rowId: '',
  nodeType: '',
  title: '',
  result: '',
  opinion: '',
  organizations: [],
  tenant: '',
  businessApprover: '',
  notice: '',
  errors: {
    result: '',
    organizations: '',
    tenant: ''
  }
})
const approvalNotificationModal = reactive({
  visible: false,
  rowId: '',
  notice: ''
})
let permissionUserDirectoryReady = false
const approvals = ref([
  createApprovalRow({
    id: 'AP-20260713-001',
    typeKey: 'change',
    type: '权限变更',
    applicant: 'admin',
    applicantItcode: 'admin',
    target: 'zhangrui32',
    nodeType: 'relation',
    approverItcode: 'wangxt8',
    handlers: ['wangxt8'],
    time: '2026-07-13 10:32',
    personType: 'external',
    relatedAccount: 'wangxt8',
    reason: '外部协作人员需要参与乐享运营日报整理，请关联人先确认协作关系。',
    permissionSnapshot: {
      selectedRoleIds: ['bpo-collab'],
      copiedFromItcode: '',
      copiedRoleIds: [],
      selectedDataPermissionIds: ['data.ops.region.south'],
      manualDataPermissionIds: [],
      copiedDataSourceMap: {}
    }
  }),
  createApprovalRow({
    id: 'AP-20260713-002',
    typeKey: 'change',
    type: '权限变更',
    applicant: 'sunll1',
    applicantItcode: 'sunll1',
    target: 'liwen08',
    nodeType: 'applicant-manager',
    targetItcode: 'liwen08',
    applicantManager: 'sunll1',
    targetManager: 'huangjq5',
    approverItcode: 'sunll1',
    handlers: ['sunll1'],
    time: '2026-07-13 09:48',
    reason: '补充商品运营配置和运营数据查看权限，支持日常活动配置复核。',
    permissionSnapshot: {
      selectedRoleIds: ['product-op'],
      copiedFromItcode: 'liwen08',
      copiedRoleIds: ['product-op'],
      selectedDataPermissionIds: ['data.ops.region.north', 'data.ops.metric.gmv', 'data.member.profile.rights'],
      manualDataPermissionIds: ['data.member.profile.rights'],
      copiedDataSourceMap: {
        'data.ops.region.north': '角色继承',
        'data.ops.metric.gmv': '角色继承',
        'data.member.profile.rights': '用户单独授权'
      }
    }
  }),
  createApprovalRow({
    id: 'AP-20260713-003',
    typeKey: 'create',
    type: '创建账号',
    applicant: 'huangjq5',
    applicantItcode: 'huangjq5',
    target: 'chenyan9',
    nodeType: 'business',
    approverItcode: 'zhangjq4',
    handlers: ['zhangjq4', 'huangjq5'],
    time: '2026-07-13 09:12',
    personType: 'internal',
    reason: '新成员进入消费业务运营组，需要开通基础工作台账号和线索查看能力。',
    businessInfo: { organizations: ['乐享运营'], tenant: 'leaibot-cn' },
    permissionSnapshot: {
      selectedRoleIds: ['ops-pm'],
      copiedFromItcode: '',
      copiedRoleIds: [],
      selectedDataPermissionIds: [],
      manualDataPermissionIds: [],
      copiedDataSourceMap: {}
    }
  }),
  createApprovalRow({
    id: 'AP-20260702-006',
    typeKey: 'create',
    type: '创建账号',
    applicant: 'sunll1',
    applicantItcode: 'sunll1',
    target: 'liwen08',
    nodeType: 'done',
    approverItcode: 'sunzh4',
    handlers: ['sunll1', 'zhangjq4', 'sunzh4'],
    status: '已完成',
    statusKey: 'done',
    node: '执行完成',
    time: '2026-07-02 17:18',
    permissionSnapshot: {
      selectedRoleIds: ['product-op'],
      copiedFromItcode: '',
      copiedRoleIds: [],
      selectedDataPermissionIds: ['data.ops.region.north', 'data.ops.metric.gmv'],
      manualDataPermissionIds: [],
      copiedDataSourceMap: {}
    }
  }),
  createApprovalRow({
    id: 'AP-20260702-003',
    typeKey: 'disable',
    type: '禁用账号',
    applicant: 'huangjq5',
    applicantItcode: 'huangjq5',
    target: 'temp-bpo',
    nodeType: 'done',
    approverItcode: 'sunzh4',
    handlers: ['huangjq5', 'sunzh4'],
    status: '已完成',
    statusKey: 'done',
    node: '系统执行结果',
    time: '2026-07-02 15:44'
  }),
  createApprovalRow({
    id: 'AP-20260701-009',
    typeKey: 'reset',
    type: '重置密码',
    applicant: 'zhangxy43',
    applicantItcode: 'zhangxy43',
    target: 'wangxt8',
    nodeType: 'rework',
    approverItcode: 'sunll1',
    handlers: ['sunll1'],
    status: '已驳回',
    statusKey: 'rejected',
    node: '申请人修改',
    time: '2026-07-01 19:12'
  })
])
const pendingApprovalCount = computed(() => approvals.value.filter((row) => row.statusKey === 'pending').length)
const roleTypeOptions = ['角色管理员', '普通角色']
const roleGroupOptions = ['乐享运营', '商品中心', '搜索后台', '企业客户管理', '外部协作']
const sensitivityOptions = [
  { value: 'standard-data', label: '标准数据（低风险）', risk: 'low', desc: '常规查看或脱敏数据。' },
  { value: 'standard-action', label: '标准操作（低风险）', risk: 'low', desc: '常规配置、查询或低影响操作。' },
  { value: 'sensitive-data', label: '敏感数据（中风险）', risk: 'medium', desc: '包含报表、业务指标、客户或运营敏感信息。' },
  { value: 'sensitive-action', label: '敏感操作（中风险）', risk: 'medium', desc: '涉及发布、导出、分配或影响业务结果的操作。' },
  { value: 'it-config-data', label: 'IT 配置数据（高风险）', risk: 'high', desc: '涉及系统配置、租户、接口或高影响后台数据。' }
]

const roleFilters = reactive({
  keyword: '',
  group: '',
  sensitivity: ''
})

const emptyRoleDraft = () => ({
  id: '',
  code: 'NEW',
  name: '',
  type: '普通角色',
  group: '乐享运营',
  desc: '',
  owner: '',
  sensitivity: 'sensitive-data',
  users: 0,
  systemRole: false,
  updatedAt: '',
  functionPermissionIds: [],
  dataPermissionIds: [],
  functionPermissionNotes: {},
  dataPermissionNotes: {},
  customDataRules: []
})

const roleEditor = reactive({
  visible: false,
  mode: 'view',
  roleId: '',
  activeTab: 'basic',
  dataTab: 'normal',
  draft: emptyRoleDraft(),
  notice: '',
  errors: {
    name: '',
    type: '',
    group: '',
    owner: '',
    dataMode: ''
  }
})

const roleDeleteConfirm = reactive({
  visible: false,
  role: null
})
const userTypeOptions = ['内部用户', '外部用户', '临时协作用户']
const users = reactive([
  {
    userAccount: 'U-10032',
    loginAccount: 'zhangrui32',
    name: '张睿',
    bindItcode: true,
    mobile: '13800000000',
    email: 'zhangrui32@lenovo.com',
    validUntil: '2026-12-31',
    userType: '内部用户',
    tenant: 'leaibot-cn',
    organization: '乐享运营',
    internalAdAccount: 'LENOVO\\zhangrui32',
    remark: '负责运营日报、活动复盘和报告生成。',
    status: 'enabled',
    statusKey: 'done',
    roleIds: ['ops-pm'],
    extraDataPermissionIds: [],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [
      { id: 'user-rule-zhangrui-east', dataset: '会员标签库', fields: '等级、权益使用', organization: '乐享运营', region: '华东区', period: '2026-07-01 至 2026-09-30', remark: '活动复盘临时授权。' }
    ],
    changeLogs: [
      { time: '2026-07-13 18:20', type: '数据权限调整', ticketNo: 'AP-20260713-003', detail: '新增会员等级用户单独授权，用于活动复盘。' },
      { time: '2026-07-12 10:10', type: '设置角色', ticketNo: 'AP-20260712-006', detail: '分配运营分析 PM 角色。' }
    ],
    loginLogs: [
      { time: '2026-07-14 09:32', result: 'success', ip: '10.24.18.36', device: 'Chrome / Windows', entry: '乐享 AI 工作台', failureReason: '' },
      { time: '2026-07-13 21:08', result: 'failed', ip: '10.24.18.36', device: 'Chrome / Windows', entry: '乐享 AI 工作台', failureReason: '密码输入错误' }
    ]
  },
  {
    userAccount: 'U-10021',
    loginAccount: 'sunll1',
    name: '孙立',
    bindItcode: true,
    mobile: '13900000001',
    email: 'sunll1@lenovo.com',
    validUntil: '长期有效',
    userType: '内部用户',
    tenant: 'leaibot-cn',
    organization: '平台运营',
    internalAdAccount: 'LENOVO\\sunll1',
    remark: '平台运营负责人，承担直线经理审批。',
    status: 'enabled',
    statusKey: 'done',
    roleIds: ['lead-operator'],
    extraDataPermissionIds: [],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [],
    changeLogs: [
      { time: '2026-07-11 09:30', type: '基本信息编辑', ticketNo: 'AP-20260711-002', detail: '更新所属组织为平台运营。' }
    ],
    loginLogs: [
      { time: '2026-07-14 08:46', result: 'success', ip: '10.16.8.21', device: 'Edge / Windows', entry: '审批列表', failureReason: '' }
    ]
  },
  {
    userAccount: 'U-10045',
    loginAccount: 'huangjq5',
    name: '黄佳琪',
    bindItcode: true,
    mobile: '13900000002',
    email: 'huangjq5@lenovo.com',
    validUntil: '2026-12-31',
    userType: '内部用户',
    tenant: 'shop-chat',
    organization: '商用业务运营',
    internalAdAccount: 'LENOVO\\huangjq5',
    remark: '负责商品运营和发布前复核。',
    status: 'enabled',
    statusKey: 'done',
    roleIds: ['product-op'],
    extraDataPermissionIds: ['data.member.profile.rights'],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [],
    changeLogs: [
      { time: '2026-07-10 16:08', type: '设置角色', ticketNo: 'AP-20260710-004', detail: '分配商品运营角色，并保留会员权益使用额外数据权限。' }
    ],
    loginLogs: [
      { time: '2026-07-13 18:02', result: 'success', ip: '10.28.6.45', device: 'Chrome / Windows', entry: '商品运营', failureReason: '' }
    ]
  },
  {
    userAccount: 'U-10088',
    loginAccount: 'liwen08',
    name: '李雯',
    bindItcode: true,
    mobile: '13900000008',
    email: 'liwen08@lenovo.com',
    validUntil: '长期有效',
    userType: '内部用户',
    tenant: 'leaibot-cn',
    organization: '系统管理',
    internalAdAccount: 'LENOVO\\liwen08',
    remark: '历史管理员账号，保留较高权限用于 POC 清理演示。',
    status: 'enabled',
    statusKey: 'done',
    adminPermissionCleaned: false,
    roleIds: ['admin', 'product-op'],
    extraDataPermissionIds: ['data.member.profile.rights', 'data.lead.pool.all'],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [
      {
        id: 'user-rule-liwen-admin-report',
        menuKey: 'data-ai',
        menuName: '数据AI助手',
        groups: [
          { id: 'user-rule-liwen-admin-report-group', relation: '', title: '历史报表临时授权', conditions: [
            { id: 'user-rule-liwen-admin-report-source', dimension: '数据来源', operator: '包含', values: ['报表'] },
            { id: 'user-rule-liwen-admin-report-field', dimension: '字段', operator: '包含', values: ['GMV', '会员权益', '线索状态'] }
          ] }
        ]
      }
    ],
    changeLogs: [
      { time: '2026-03-20 19:10', type: '设置角色', ticketNo: 'AP-20260320-009', detail: '分配 admin 和商品运营角色，用于阶段性后台配置。' }
    ],
    emailNotifications: [],
    loginLogs: [
      { time: '2026-03-20 18:42', result: 'success', ip: '10.24.12.8', device: 'Chrome / Windows', entry: 'admin 权限后台', failureReason: '' },
      { time: '2026-07-02 09:20', result: 'success', ip: '10.24.12.8', device: 'Chrome / Windows', entry: '乐享 AI 工作台', failureReason: '' }
    ]
  },  {
    userAccount: 'U-10089',
    loginAccount: 'wangming9',
    name: '王明',
    bindItcode: true,
    mobile: '13900000009',
    email: 'wangming9@lenovo.com',
    validUntil: '长期有效',
    userType: '内部用户',
    tenant: 'leaibot-cn',
    organization: '系统管理',
    internalAdAccount: 'LENOVO\wangming9',
    remark: '管理员备份账号，用于 POC 展示清理前一天邮件提醒。',
    status: 'enabled',
    statusKey: 'done',
    adminPermissionCleaned: false,
    roleIds: ['admin'],
    extraDataPermissionIds: ['data.ops.metric.flow'],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [],
    changeLogs: [
      { time: '2026-04-23 11:05', type: '设置角色', ticketNo: 'AP-20260423-011', detail: '分配 admin 角色，作为后台管理员备份账号。' }
    ],
    emailNotifications: [],
    loginLogs: [
      { time: '2026-04-23 10:20', result: 'success', ip: '10.24.12.9', device: 'Edge / Windows', entry: 'admin 权限后台', failureReason: '' }
    ]
  },  {
    userAccount: 'EXT-9008',
    loginAccount: 'temp-bpo',
    name: '外部协作',
    bindItcode: false,
    mobile: '13700000003',
    email: 'temp-bpo@partner.example.com',
    validUntil: '2026-08-31',
    userType: '外部用户',
    tenant: 'leaibot-cn',
    organization: '外部协作',
    internalAdAccount: '',
    remark: 'BPO 临时协作账号，仅保留脱敏查看能力。',
    status: 'disabled',
    statusKey: 'rejected',
    roleIds: ['bpo-collab'],
    extraDataPermissionIds: [],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [],
    changeLogs: [
      { time: '2026-07-02 15:44', type: '禁用用户', ticketNo: 'AP-20260702-003', detail: '项目阶段结束，暂停账号登录和权限使用。' }
    ],
    loginLogs: [
      { time: '2026-07-02 16:21', result: 'failed', ip: '172.16.4.18', device: 'Chrome / Windows', entry: '乐享 AI 工作台', failureReason: '账号已禁用' }
    ]
  }
])
permissionUserDirectoryReady = true

const userFilters = reactive({
  account: '',
  name: '',
  bindItcode: ''
})

const adminCleanupRunDate = '2026-07-22'
const adminCleanupNotice = ref('')
const adminAutomationResult = reactive({ reminded: 0, cleaned: 0 })
const userWorkspace = reactive({
  visible: false,
  mode: 'view',
  userAccount: '',
  activeTab: 'basic',
  dataTab: 'normal',
  loginFilter: 'all',
  generatedApplicationNo: '',
  draft: null,
  notice: '',
  errors: {
    loginAccount: '',
    relatedAccount: '',
    targetManager: '',
    tenant: '',
    validUntil: '',
    businessApprover: '',
    dataMode: ''
  }
})

const userRoleModal = reactive({
  visible: false,
  keyword: '',
  selectedIds: [],
  selectedFunctionIds: [],
  selectedDataIds: [],
  targetUserAccount: '',
  detailRoleId: '',
  detailKeyword: '',
  activePermissionTab: 'function'
})

const userStatusConfirm = reactive({
  visible: false,
  action: 'disable',
  userAccount: '',
  reason: '',
  error: ''
})
const organizations = reactive([
  {
    id: 'leai-root',
    code: 'LEAI',
    name: '联想乐享',
    parentId: '',
    level: 0,
    description: '联想乐享工作台的根组织，统一承接权限申请、成员归属和业务范围配置。',
    owner: 'admin',
    status: 'enabled',
    memberCount: 3,
    updatedAt: '2026-07-14 15:20',
    scope: '权限体系根组织',
    members: [
      { name: '管峰', account: 'guanfeng2', department: '联想乐享', orgRole: '管理员', permissionIdentity: '业务管理员', status: 'enabled' },
      { name: '孙莉莉', account: 'sunll1', department: '平台运营', orgRole: '负责人', permissionIdentity: '运营人员', status: 'enabled' },
      { name: '张俊强', account: 'zhangjq4', department: '消费业务', orgRole: '成员', permissionIdentity: '数据查看人', status: 'enabled' }
    ],
    children: [
      {
        id: 'leai-ops',
        code: 'OPS',
        name: '乐享运营',
        parentId: 'leai-root',
        level: 1,
        description: '负责乐享前台运营、活动配置、内容发布和日常数据观察。',
        owner: 'sunll1',
        status: 'enabled',
        memberCount: 4,
        updatedAt: '2026-07-14 15:10',
        scope: '运营角色、活动数据和内容权限归属',
        members: [
          { name: '孙莉莉', account: 'sunll1', department: '乐享运营', orgRole: '负责人', permissionIdentity: '业务管理员', status: 'enabled' },
          { name: '张瑞', account: 'zhangrui32', department: '乐享运营', orgRole: '管理员', permissionIdentity: '运营人员', status: 'enabled' },
          { name: '王一', account: 'wangyi8', department: '活动运营', orgRole: '成员', permissionIdentity: '运营人员', status: 'enabled' },
          { name: '外部协作', account: 'temp-bpo', department: '外部协作', orgRole: '协作人', permissionIdentity: '外部协作', status: 'disabled' }
        ],
        children: [
          {
            id: 'ops-mall',
            code: 'OPS-MALL',
            name: '商城运营',
            parentId: 'leai-ops',
            level: 2,
            description: '负责商品配置、发布检查、订单相关看板和商城活动运营。',
            owner: 'zhangrui32',
            status: 'enabled',
            memberCount: 2,
            updatedAt: '2026-07-13 18:30',
            scope: '商品、订单和商城活动数据权限',
            members: [
              { name: '张瑞', account: 'zhangrui32', department: '商城运营', orgRole: '负责人', permissionIdentity: '业务管理员', status: 'enabled' },
              { name: '陈铭', account: 'chenming7', department: '商城运营', orgRole: '成员', permissionIdentity: '运营人员', status: 'enabled' }
            ],
            children: []
          },
          {
            id: 'ops-content',
            code: 'OPS-CONTENT',
            name: '内容运营',
            parentId: 'leai-ops',
            level: 2,
            description: '负责内容素材、发布校验、知识内容和运营话术维护。',
            owner: 'liwen9',
            status: 'enabled',
            memberCount: 2,
            updatedAt: '2026-07-12 10:05',
            scope: '内容发布和素材管理功能权限',
            members: [
              { name: '李雯', account: 'liwen9', department: '内容运营', orgRole: '负责人', permissionIdentity: '运营人员', status: 'enabled' },
              { name: '周可', account: 'zhouke3', department: '内容运营', orgRole: '成员', permissionIdentity: '数据查看人', status: 'enabled' }
            ],
            children: []
          }
        ]
      },
      {
        id: 'geo-board',
        code: 'GEO',
        name: 'GEO 看板',
        parentId: 'leai-root',
        level: 1,
        description: '负责 GEO 信源监测、引用分析、搜索表现和趋势报告。',
        owner: 'zhangjq4',
        status: 'enabled',
        memberCount: 2,
        updatedAt: '2026-07-13 16:42',
        scope: 'GEO 信源、看板和导出权限',
        members: [
          { name: '张俊强', account: 'zhangjq4', department: 'GEO 看板', orgRole: '负责人', permissionIdentity: '业务管理员', status: 'enabled' },
          { name: '黄佳琪', account: 'huangjq5', department: 'GEO 看板', orgRole: '成员', permissionIdentity: '数据查看人', status: 'enabled' }
        ],
        children: []
      },
      {
        id: 'enterprise-customer',
        code: 'BIZ-CUSTOMER',
        name: '企业客户',
        parentId: 'leai-root',
        level: 1,
        description: '负责企业客户线索、客户分层、商机跟进和客户运营数据。',
        owner: 'huangjq5',
        status: 'enabled',
        memberCount: 2,
        updatedAt: '2026-07-11 14:18',
        scope: '企业客户线索和商机数据权限',
        members: [
          { name: '黄佳琪', account: 'huangjq5', department: '企业客户', orgRole: '负责人', permissionIdentity: '业务管理员', status: 'enabled' },
          { name: '赵宁', account: 'zhaoning6', department: '企业客户', orgRole: '成员', permissionIdentity: '运营人员', status: 'enabled' }
        ],
        children: []
      },
      {
        id: 'ai-platform',
        code: 'AI-PLATFORM',
        name: 'AI 平台',
        parentId: 'leai-root',
        level: 1,
        description: '负责 Skill Hub、智能体能力、模型评测和平台级能力维护。',
        owner: 'sunzh4',
        status: 'enabled',
        memberCount: 2,
        updatedAt: '2026-07-10 19:00',
        scope: 'AI 平台功能和系统管理权限',
        members: [
          { name: '孙志', account: 'sunzh4', department: 'AI 平台', orgRole: '负责人', permissionIdentity: '业务管理员', status: 'enabled' },
          { name: '钱昊', account: 'qianhao2', department: 'AI 平台', orgRole: '管理员', permissionIdentity: '运营人员', status: 'enabled' }
        ],
        children: []
      }
    ]
  }
])

const selectedOrganizationId = ref('leai-root')
const organizationDetailModalVisible = ref(false)
const organizationSearchKeyword = ref('')
const organizationNotice = ref('')
let organizationNoticeTimer = null
const organizationTenants = [
  { label: 'leaibot-cn', value: 'leaibot-cn' },
  { label: 'workbench', value: 'workbench' },
  { label: 'geo-dashboard', value: 'geo-dashboard' }
]

const organizationEditor = reactive({
  visible: false,
  mode: 'edit',
  orgId: '',
  draft: { id: '', tenant: 'leaibot-cn', code: '', name: '', parentId: '', owner: '', creator: 'admin', status: 'enabled', description: '', scope: '' },
  errors: { tenant: '', name: '', parentId: '', code: '', description: '' },
  notice: ''
})

const organizationMemberModal = reactive({
  visible: false,
  mode: 'create',
  originalOrganizationId: '',
  originalAccount: '',
  draft: { organizationId: 'leai-root', name: '', account: '', department: '', orgRole: '成员', permissionIdentity: '运营人员', status: 'enabled' },
  errors: { name: '', account: '' },
  notice: ''
})

const records = ref([
  {
    time: '2026-07-03 11:45',
    title: '权限管理 Vue 源码链路补全',
    detail: '按墨刀原型将权限申请、审批列表、角色管理、用户管理、组织管理、数据源管理、功能管理和删除备份串成可操作 POC，并恢复账号入口跳转。',
    status: '源码已更新'
  },
  {
    time: '2026-07-02 18:10',
    title: '0702 UI 样式规范覆盖',
    detail: '在 Vue 架构内保留现有新增功能，仅对重合页面做样式覆盖和设计规范收敛。',
    status: '已更新 new 预览'
  }
])

const roleTemplate = { name: '新角色', desc: '配置菜单、数据和 Skill 权限。', scope: '待配置' }
const userTemplate = { name: '新用户', desc: '创建账号并分配角色。', scope: '待配置' }
const genericTemplate = { name: '新增项', desc: '根据当前模块补充配置。', status: '草稿' }

const selectedType = computed(() => requestTypes.find((type) => type.key === form.type) || requestTypes[0])
const isAccountStatusRequest = computed(() => ['enable', 'disable'].includes(form.type))
const isPasswordResetRequest = computed(() => form.type === 'reset')
const isCreateAccountRequest = computed(() => form.type === 'create')
const applicationInfoSchema = computed(() => resolveApplicationInfoSchema(form.type, form.personType))
const applicantIdentityText = computed(() => form.applicant + ' / ' + form.itcode)
const requiresTenantInInfoStep = computed(() => false)
const hasPermissionScopeStep = computed(() => ['create', 'change'].includes(form.type))
const applySteps = computed(() => {
  if (isPasswordResetRequest.value) return passwordResetApplySteps
  if (isAccountStatusRequest.value) return accountStatusApplySteps
  return fullApplySteps
})
const infoStepDescription = computed(() => {
  if (isPasswordResetRequest.value) return '重置密码仅支持当前用户本人自助修改，可使用旧密码或绑定手机号 / 邮箱完成身份验证。'
  if (isAccountStatusRequest.value) return '根据人员类型填写被申请人信息；手机号、邮箱选填，申请单号将在提交后自动生成。'
  if (isCreateAccountRequest.value) return '为外部协作人员创建账号时，需填写关联人 ITCode；外部用户不设置直线经理，下一步同步选择权限范围。'
  if (isExternalApplicant.value) return '外部用户没有直线经理，需要填写关联人；被申请人为外部用户时同样不设置被申请人直线经理。'
  if (isExternalPerson.value) return '申请人直线经理由当前登录信息带出；外部被申请人不设置直线经理，需要填写关联人。'
  return '申请人直线经理和被申请人直线经理由当前登录信息或被申请人信息带出，不允许修改。'
})
const infoReasonPlaceholder = computed(() => {
  if (form.type === 'enable') return '请说明启用账号的业务原因、恢复使用范围和期望生效时间。'
  if (form.type === 'disable') return '请说明禁用账号的业务原因、影响范围和是否需要保留已有权限。'
  if (form.type === 'create') return '请说明为该外部协作人员创建账号的业务场景、使用周期和内部对接关系。'
  return '请描述业务场景、需要开通的权限、使用周期和影响范围。'
})
const passwordResetModeLabel = computed(() => passwordReset.mode === 'old-password' ? '旧密码验证' : '手机号 / 邮箱验证')
const nextButtonText = computed(() => isPasswordResetRequest.value && currentStep.value === 1 ? '确认重置' : '下一步')
const finalButtonText = computed(() => isPasswordResetRequest.value ? '完成' : '提交申请')
const currentModule = computed(() => modules.find((item) => item.key === activeModule.value) || modules[0])
const flatOrganizations = computed(() => flattenOrganizations(organizations))
const selectedOrganization = computed(() => findOrganizationById(selectedOrganizationId.value))
const selectedOrganizationParent = computed(() => selectedOrganization.value?.parentId ? findOrganizationById(selectedOrganization.value.parentId) : null)
const selectedOrganizationChildren = computed(() => selectedOrganization.value?.children || [])
const selectedOrganizationMembers = computed(() => selectedOrganization.value?.members || [])
const orgChartSearchResults = computed(() => {
  const keyword = organizationSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return []
  return flatOrganizations.value.filter((org) => organizationMatchesKeyword(org, keyword)).slice(0, 8)
})

const dataSourceMenuFilterOptions = computed(() => functionMenuTree.map((root) => ({ value: root.name, label: root.name })))
const hasDataSourceFilters = computed(() => !!(dataSourceFilters.menu || dataSourceFilters.name || dataSourceFilters.sensitivity))
const filteredDataSources = computed(() => {
  const name = dataSourceFilters.name.trim().toLowerCase()
  return dataSources.filter((source) => {
    const searchableText = (source.name + ' ' + source.apiUrl + ' ' + source.permissionParam + ' ' + source.remark + ' ' + dataSourceMenuPath(source)).toLowerCase()
    const menuMatched = dataSourceMatchesMenuFilter(source, dataSourceFilters.menu)
    const nameMatched = !name || searchableText.includes(name)
    const sensitivityMatched = !dataSourceFilters.sensitivity || source.sensitivity === dataSourceFilters.sensitivity
    return menuMatched && nameMatched && sensitivityMatched
  })
})
const organizationParentOptions = computed(() => flatOrganizations.value.filter((org) => org.id !== organizationEditor.orgId))
const filteredManagedRoles = computed(() => {
  const keyword = roleFilters.keyword.trim().toLowerCase()
  return allRoles.filter((role) => {
    const keywordMatched = !keyword || role.name.toLowerCase().includes(keyword)
    const groupMatched = !roleFilters.group || role.group === roleFilters.group
    const sensitivityMatched = !roleFilters.sensitivity || role.sensitivity === roleFilters.sensitivity
    return keywordMatched && groupMatched && sensitivityMatched
  })
})
const roleEditorReadonly = computed(() => roleEditor.mode === 'view')
const roleEditorTitle = computed(() => {
  if (roleEditor.mode === 'create') return '新增角色'
  return `${roleEditor.mode === 'view' ? '查看角色' : '编辑角色'}：${roleEditor.draft.name || '未命名角色'}`
})
const roleEditorSelectedFunctionPermissions = computed(() => roleEditor.draft.functionPermissionIds
  .map((id) => allFunctionPermissions.find((permission) => permission.id === id))
  .filter(Boolean))
const roleEditorSelectedDataPermissions = computed(() => roleEditor.draft.dataPermissionIds
  .map((id) => findDataPermission(id))
  .filter(Boolean))
const roleHasNormalData = computed(() => !!roleEditor.draft.dataPermissionIds.length)
const roleHasCustomData = computed(() => !!roleEditor.draft.customDataRules.length)
const roleNormalDataLocked = computed(() => roleEditor.mode !== 'view' && roleHasNormalData.value)
const roleCustomDataLocked = computed(() => roleEditor.mode !== 'view' && roleHasCustomData.value)
const roleDataModeNotice = computed(() => {
  if (roleEditor.mode === 'view') return ''
  if (roleHasCustomData.value) return '当前使用自定义授权。如需改为普通授权，请先删除全部自定义授权。'
  if (roleHasNormalData.value) return '当前使用普通授权。如需改为自定义授权，请先取消全部普通数据权限。'
  return '请选择一种数据授权方式：普通授权或自定义授权，二者不能同时使用。'
})
const roleDeleteBlockReason = computed(() => {
  const role = roleDeleteConfirm.role
  if (!role) return ''
  if (role.systemRole) return '该角色是系统内置角色，用于基础流程或外部协作默认权限，不允许直接删除。'
  if (role.users > 0) return `该角色仍有 ${role.users} 个用户在使用，请先迁移这些用户后再删除。`
  return ''
})
const roleDeleteImpactText = computed(() => {
  const role = roleDeleteConfirm.role
  if (!role) return '请选择要删除的角色。'
  return `将删除“${role.name}”。删除后申请人无法再选择该角色，已保存的 mock 权限配置会从列表中移除。`
})
const hasUserFilters = computed(() => !!(userFilters.account || userFilters.name || userFilters.bindItcode))
const filteredUsers = computed(() => {
  const account = userFilters.account.trim().toLowerCase()
  const name = userFilters.name.trim().toLowerCase()
  return users.filter((user) => {
    const accountMatched = !account || `${user.userAccount} ${user.loginAccount}`.toLowerCase().includes(account)
    const nameMatched = !name || user.name.toLowerCase().includes(name)
    const bindMatched = !userFilters.bindItcode || (userFilters.bindItcode === 'yes' ? user.bindItcode : !user.bindItcode)
    return accountMatched && nameMatched && bindMatched
  })
})
const adminCleanupCandidates = computed(() => users.filter((user) => shouldCleanupAdminPermission(user)))
const adminCleanupReminderCandidates = computed(() => users.filter((user) => shouldSendAdminCleanupReminder(user)))
const adminCleanupReminderCount = computed(() => adminCleanupReminderCandidates.value.length + adminAutomationResult.reminded)
const userWorkspaceReadonly = computed(() => userWorkspace.mode === 'view')
const activeUser = computed(() => users.find((user) => user.userAccount === userWorkspace.userAccount) || null)
const userWorkspaceTitle = computed(() => {
  if (!userWorkspace.draft) return '用户详情'
  if (userWorkspace.mode === 'create') return '新增用户'
  return `${userWorkspace.mode === 'view' ? '用户详情' : '编辑用户'}：${userWorkspace.draft.name || userWorkspace.draft.loginAccount}`
})
const userDraftRoles = computed(() => userWorkspace.draft ? userRoles(userWorkspace.draft) : [])
const userDraftInheritedFunctionIds = computed(() => userWorkspace.draft ? userInheritedFunctionIds(userWorkspace.draft) : [])
const userDraftInheritedDataIds = computed(() => userWorkspace.draft ? userInheritedDataIds(userWorkspace.draft) : [])

const userDraftExtraDataPermissions = computed(() => userWorkspace.draft
  ? userWorkspace.draft.extraDataPermissionIds.map((id) => findDataPermission(id)).filter(Boolean)
  : [])
const userWorkspaceSelectedDataIds = computed(() => userWorkspace.draft
  ? [...new Set([...userDraftInheritedDataIds.value, ...userWorkspace.draft.extraDataPermissionIds])]
  : [])
const userWorkspaceDataSourceLabels = computed(() => Object.fromEntries(userWorkspaceSelectedDataIds.value.map((id) => [
  id,
  userDraftInheritedDataIds.value.includes(id) ? '角色继承' : '用户单独授权'
])))
const userHasNormalData = computed(() => !!(userWorkspace.draft?.extraDataPermissionIds?.length))
const userHasCustomData = computed(() => !!(userWorkspace.draft?.customDataRules?.length))
const userNormalDataLocked = computed(() => userWorkspace.mode !== 'view' && userHasNormalData.value)
const userCustomDataLocked = computed(() => userWorkspace.mode !== 'view' && userHasCustomData.value)
const userDataModeNotice = computed(() => {
  if (userWorkspace.mode === 'view') return ''
  if (userHasCustomData.value) return '当前使用自定义授权。如需改为普通授权，请先删除全部自定义授权。'
  if (userHasNormalData.value) return '当前使用普通授权。如需改为自定义授权，请先取消全部额外普通数据权限。'
  return '请选择一种数据授权方式：普通授权或自定义授权，二者不能同时使用。'
})
const filteredUserLoginLogs = computed(() => {
  const logs = userWorkspace.draft?.loginLogs || []
  if (userWorkspace.loginFilter === 'success') return logs.filter((log) => log.result === 'success')
  if (userWorkspace.loginFilter === 'failed') return logs.filter((log) => log.result === 'failed')
  return logs
})
const userPermissionChanged = computed(() => userWorkspace.mode === 'edit' && !!activeUser.value && !!userWorkspace.draft && hasUserPermissionChanged(activeUser.value, userWorkspace.draft))
const activePendingUserPermissionApproval = computed(() => pendingUserPermissionApproval(activeUser.value))
const userWorkspacePermissionReadonly = computed(() => userWorkspaceReadonly.value || (userWorkspace.mode === 'edit' && !!activePendingUserPermissionApproval.value))
const userWorkspaceSaveLabel = computed(() => {
  if (userWorkspace.mode === 'create') return '提交创建账号申请'
  return userPermissionChanged.value ? '提交权限变更申请' : '保存基本信息'
})
const filteredUserRoleOptions = computed(() => {
  const keyword = userRoleModal.keyword.trim().toLowerCase()
  if (!keyword) return allRoles
  return allRoles.filter((role) => {
    const functionText = role.functionPermissionIds.map(permissionName).join(' ')
    return `${role.name} ${functionText}`.toLowerCase().includes(keyword)
  })
})
const statusTargetUser = computed(() => users.find((user) => user.userAccount === userStatusConfirm.userAccount) || null)
function functionMenuParts(menu = '') {
  const [root = '', second = '', leaf = ''] = String(menu).split('/').map((part) => part.trim())
  return { root, second, leaf }
}
function menuBranchMeta(menu = '') {
  for (const root of functionMenuTree) {
    for (const child of root.children) {
      if (child.nodeType === 'menu' && (child.name === menu || functionMenuFullPath(root, child) === menu)) {
        return { rootId: root.id, rootName: root.name, branchId: child.id, branchName: child.name }
      }
      const leaf = child.children.find((item) => item.nodeType === 'menu' && (item.name === menu || functionMenuLeafPath(root, child, item) === menu))
      if (leaf) return { rootId: root.id, rootName: root.name, branchId: leaf.id, branchName: leaf.name }
    }
  }
  const parts = functionMenuParts(menu)
  const root = functionMenuTree.find((item) => item.name === parts.root)
  const pageName = parts.leaf || parts.second || '目录级数据源'
  if (root) {
    return {
      rootId: root.id,
      rootName: root.name,
      branchId: customPermissionId('menu.custom', `${root.id}.${pageName}`),
      branchName: pageName
    }
  }
  return { rootId: 'func.other', rootName: '其他能力', branchId: 'func.other.misc', branchName: '未归类权限' }
}

function ensureFunctionPermissionBranch(meta) {
  let root = functionPermissionTree.find((item) => item.id === meta.rootId)
  if (!root) {
    root = { id: meta.rootId, name: meta.rootName, children: [] }
    functionPermissionTree.push(root)
  }
  let branch = root.children.find((item) => item.id === meta.branchId)
  if (!branch) {
    branch = { id: meta.branchId, name: meta.branchName, children: [] }
    root.children.push(branch)
  } else {
    branch.name = meta.branchName
  }
  return branch
}

function ensureDataPermissionBranch(meta) {
  let root = dataPermissionTree.find((item) => item.id === meta.rootId)
  if (!root) {
    root = { id: meta.rootId, name: meta.rootName, children: [] }
    dataPermissionTree.push(root)
  }
  let branch = root.children.find((item) => item.id === meta.branchId)
  if (!branch) {
    branch = { id: meta.branchId, name: meta.branchName, children: [] }
    root.children.push(branch)
  } else {
    branch.name = meta.branchName
  }
  return branch
}

function removePermissionLeaf(tree, id) {
  tree.forEach((root) => {
    root.children.forEach((branch) => {
      branch.children = branch.children.filter((leaf) => leaf.id !== id)
    })
  })
}

function syncFunctionPermissionToTree(permission) {
  if (!permission?.id) return
  removePermissionLeaf(functionPermissionTree, permission.id)
  const branch = ensureFunctionPermissionBranch(menuBranchMeta(permission.menu))
  branch.children.push({ id: permission.id, name: permission.name })
}

function removeFunctionPermissionFromTree(id) {
  removePermissionLeaf(functionPermissionTree, id)
  const permissionIndex = allFunctionPermissions.findIndex((permission) => permission.id === id)
  if (permissionIndex >= 0) allFunctionPermissions.splice(permissionIndex, 1)
}

function dataPermissionIdFromSource(source) {
  return source.dataPermissionId || customPermissionId('data.source', source.id || source.name)
}

function syncDataSourcePermissionToTree(source) {
  if (!source?.id) return ''
  const permissionId = dataPermissionIdFromSource(source)
  source.dataPermissionId = permissionId
  const existing = dataPermissionTree.flatMap((root) => root.children.flatMap((branch) => branch.children))
    .filter((leaf) => leaf.sourceId === source.id || leaf.id === permissionId)
  existing.forEach((leaf) => removePermissionLeaf(dataPermissionTree, leaf.id))
  const branch = ensureDataPermissionBranch({
    rootId: source.menu, rootName: source.menu, branchId: source.id, branchName: source.name
  })
  const leaves = existing.length ? existing : [{ id: permissionId, name: source.value || '默认范围' }]
  branch.children.push(...leaves.map((leaf) => ({
    ...leaf, sourceId: source.id, group: source.menu, page: source.name,
    apiUrl: source.apiUrl, permissionParam: source.permissionParam
  })))
  return permissionId
}

function removeIdFromArray(target, id) {
  const index = target.indexOf(id)
  if (index >= 0) target.splice(index, 1)
}

function removeDataSourcePermission(source) {
  const permissionIds = new Set([
    dataPermissionIdFromSource(source),
    ...dataPermissionTree.flatMap((root) => root.children.flatMap((branch) => branch.children))
      .filter((leaf) => leaf.sourceId === source.id).map((leaf) => leaf.id)
  ])
  permissionIds.forEach(removeDataPermissionById)
}

function removeDataPermissionById(permissionId) {
  removePermissionLeaf(dataPermissionTree, permissionId)
  allRoles.forEach((role) => removeIdFromArray(role.dataPermissionIds, permissionId))
  users.forEach((user) => {
    removeIdFromArray(user.extraDataPermissionIds || [], permissionId)
    removeIdFromArray(user.suppressedRoleDataPermissionIds || [], permissionId)
  })
  removeIdFromArray(selectedDataPermissionIds.value, permissionId)
  removeIdFromArray(manualDataPermissionIds.value, permissionId)
  removeIdFromArray(dataModal.selectedIds, permissionId)
  removeIdFromArray(roleModal.selectedDataIds, permissionId)
  removeIdFromArray(userRoleModal.selectedDataIds, permissionId)
  removeIdFromArray(roleEditor.draft.dataPermissionIds, permissionId)
  if (userWorkspace.draft) {
    removeIdFromArray(userWorkspace.draft.extraDataPermissionIds || [], permissionId)
    removeIdFromArray(userWorkspace.draft.suppressedRoleDataPermissionIds || [], permissionId)
  }
  delete copiedDataSourceMap[permissionId]
}

function dataPermissionBranchMeta(id) {
  for (const group of dataPermissionTree) {
    for (const child of group.children) {
      if (child.children.some((leaf) => leaf.id === id)) {
        return { rootId: group.id, rootName: group.name, branchId: child.id, branchName: child.name }
      }
    }
  }
  return branchMetaById(dataBranchId(id))
}

const functionRootOptions = computed(() => functionMenuTree.map((root) => root.name))
const functionSecondMenuOptions = computed(() => {
  const roots = functionFilters.root
    ? functionMenuTree.filter((root) => root.name === functionFilters.root)
    : functionMenuTree
  return [...new Set(roots.flatMap((root) => allFunctionMenuLeaves(root).map(({ leaf }) => leaf.name)))]
})
const functionDirectoryParentOptions = computed(() => [
  { id: '__root__', label: '根目录' },
  ...functionMenuTree
    .filter((root) => root.id !== functionDirectoryEditor.targetId)
    .map((root) => ({ id: root.id, label: root.name }))
])
const functionMenuParentOptions = computed(() => flattenFunctionDirectories().map((item) => ({ id: item.node.id, label: item.path })))
const hasFunctionFilters = computed(() => !!(functionFilters.name || functionFilters.root || functionFilters.menu || functionFilters.type))

function functionCatalogStructureRows() {
  const rows = []
  functionMenuTree.forEach((root, rootIndex) => {
    const rootSort = (Number(root.order) || rootIndex + 1) * 100000
    rows.push({
      id: root.id,
      parentId: '',
      depth: 0,
      itemKind: 'directory',
      menu: root.name,
      name: root.name,
      description: root.description || '一级目录，承载下级目录和页面菜单。',
      type: 'directory',
      status: root.status || 'enabled',
      interfaces: [],
      sortIndex: rootSort
    })
    root.children.forEach((child, childIndex) => {
      const childSort = rootSort + (Number(child.order) || childIndex + 1) * 1000
      if (child.nodeType === 'directory') {
        rows.push({
          id: child.id,
          parentId: root.id,
          depth: 1,
          itemKind: 'directory',
          menu: functionMenuFullPath(root, child),
          name: child.name,
          description: child.description || '二级目录，承载页面菜单。',
          type: 'directory',
          status: child.status || 'enabled',
          interfaces: [],
          sortIndex: childSort
        })
        child.children.filter((leaf) => leaf.nodeType === 'menu').forEach((leaf, leafIndex) => {
          rows.push({
            id: leaf.id,
            parentId: child.id,
            depth: 2,
            itemKind: 'menu',
            menu: functionMenuFullPath(root, child, leaf),
            name: leaf.name,
            description: leaf.description || '页面菜单，承载功能、按钮和 Skill 能力。',
            type: 'menu',
            status: leaf.status || 'enabled',
            interfaces: [],
            sortIndex: childSort + (Number(leaf.order) || leafIndex + 1) * 10
          })
        })
        return
      }
      rows.push({
        id: child.id,
        parentId: root.id,
        depth: 1,
        itemKind: 'menu',
        menu: functionMenuFullPath(root, child),
        name: child.name,
        description: child.description || '页面菜单，承载功能、按钮和 Skill 能力。',
        type: 'menu',
        status: child.status || 'enabled',
        interfaces: [],
        sortIndex: childSort
      })
    })
  })
  return rows
}

const functionCatalogRows = computed(() => {
  const structureRows = functionCatalogStructureRows()
  const menuSortMap = new Map(structureRows.filter((item) => item.itemKind === 'menu').map((item) => [item.menu, item]))
  const functionRows = managedFunctions.map((item, index) => {
    const parent = menuSortMap.get(item.menu)
    return {
      ...item,
      parentId: parent?.id || '',
      depth: (parent?.depth ?? 0) + 1,
      itemKind: 'function',
      sortIndex: (parent?.sortIndex || 999000) + 100 + index
    }
  })
  const rows = [...structureRows, ...functionRows].sort((a, b) => a.sortIndex - b.sortIndex || a.name.localeCompare(b.name, 'zh-Hans-CN'))
  const parentIds = new Set(rows.map((item) => item.parentId).filter(Boolean))
  return rows.map((item) => ({ ...item, hasChildren: parentIds.has(item.id) }))
})

const functionTreeChildCounts = computed(() => {
  const counts = new Map()
  functionCatalogRows.value.forEach((item) => {
    if (!item.parentId) return
    counts.set(item.parentId, (counts.get(item.parentId) || 0) + 1)
  })
  return counts
})

function functionTreeChildCount(item) {
  return functionTreeChildCounts.value.get(item.id) || 0
}

function functionTreeRowMatches(item, name) {
  const menuParts = functionMenuParts(item.menu)
  const menuName = menuParts.leaf || menuParts.second
  const searchableText = `${item.name} ${item.description} ${item.menu}`.toLowerCase()
  const nameMatched = !name || searchableText.includes(name)
  const rootMatched = !functionFilters.root || menuParts.root === functionFilters.root
  const menuMatched = !functionFilters.menu || menuName === functionFilters.menu
  const typeMatched = !functionFilters.type || item.type === functionFilters.type
  return nameMatched && rootMatched && menuMatched && typeMatched
}

function isFunctionTreeExpanded(item) {
  if (!item?.hasChildren) return false
  if (item.itemKind === 'directory') return !collapsedFunctionTreeIds.value.has(item.id)
  if (item.itemKind === 'menu') return expandedFunctionMenuIds.value.has(item.id)
  return false
}

function isFunctionTreeRowVisible(item, rowMap) {
  if (!item.parentId) return true
  const parent = rowMap.get(item.parentId)
  if (!parent) return true
  return isFunctionTreeExpanded(parent) && isFunctionTreeRowVisible(parent, rowMap)
}

const filteredManagedFunctions = computed(() => {
  const name = functionFilters.name.trim().toLowerCase()
  const rows = functionCatalogRows.value
  const rowMap = new Map(rows.map((item) => [item.id, item]))
  if (!hasFunctionFilters.value) {
    return rows.filter((item) => isFunctionTreeRowVisible(item, rowMap))
  }
  const visibleIds = new Set()
  rows.forEach((item) => {
    if (!functionTreeRowMatches(item, name)) return
    let cursor = item
    while (cursor) {
      visibleIds.add(cursor.id)
      cursor = cursor.parentId ? rowMap.get(cursor.parentId) : null
    }
  })
  return rows.filter((item) => visibleIds.has(item.id))
})
const selectedManagedFunction = computed(() => filteredManagedFunctions.value.find((item) => item.id === selectedFunctionId.value) || filteredManagedFunctions.value[0] || null)
const selectedFunctionUsage = computed(() => selectedManagedFunction.value?.itemKind === 'function' ? functionUsage(selectedManagedFunction.value) : { roles: [], users: [] })
const functionMenuEditorRoot = computed(() => functionMenuTree.find((root) => root.id === functionMenuEditor.draft.rootId) || functionMenuTree[0])
const functionMenuEditorParentOptions = computed(() => functionMenuEditorRoot.value?.children || [])
const activeFunctionMenuRoot = computed(() => functionMenuTree.find((root) => root.id === functionEditor.menuRootId) || functionMenuTree[0])
const activeFunctionMenuChildren = computed(() => activeFunctionMenuRoot.value?.children || [])
const activeFunctionMenuChild = computed(() => activeFunctionMenuChildren.value.find((child) => child.id === functionEditor.menuChildId) || activeFunctionMenuChildren.value[0] || null)
const activeFunctionMenuLeaves = computed(() => activeFunctionMenuChild.value?.children?.filter((item) => item.nodeType === 'menu') || [])
const isExternalPerson = computed(() => isCreateAccountRequest.value || form.personType === 'external')
const isInternalPerson = computed(() => !isExternalPerson.value)
const isExternalApplicant = computed(() => form.applicantPersonType === 'external')
const requiresRelatedAccount = computed(() => isCreateAccountRequest.value || form.personType === 'external')
const targetPrincipal = computed(() => isInternalPerson.value ? form.targetItcode : form.targetUser)
const isSelfApplication = computed(() => !isCreateAccountRequest.value && samePrincipal(form.itcode, targetPrincipal.value))
const selectedRoles = computed(() => allRoles.filter((role) => selectedRoleIds.value.includes(role.id)))
const copiedRoles = computed(() => allRoles.filter((role) => copiedRoleIds.value.includes(role.id)))
const allSelectedRoles = computed(() => allRoles.filter((role) => [...selectedRoleIds.value, ...copiedRoleIds.value].includes(role.id)))
const allSelectedRoleConflicts = computed(() => detectCustomDataRoleConflicts(allSelectedRoles.value))
const roleModalCandidateConflicts = computed(() => detectCustomDataRoleConflicts(roleObjectsForIds([...roleModal.selectedIds, ...copiedRoleIds.value])))
const userRoleModalConflicts = computed(() => detectCustomDataRoleConflicts(roleObjectsForIds(userRoleModal.selectedIds)))
const copiedFromUser = computed(() => copyableUsers.find((user) => user.itcode === copiedFromItcode.value) || null)
const filteredRoleOptions = computed(() => {
  const keyword = roleModal.keyword.trim().toLowerCase()
  if (!keyword) return allRoles
  return allRoles.filter((role) => {
    const functionText = role.functionPermissionIds.map(permissionName).join(' ')
    return `${role.name} ${functionText}`.toLowerCase().includes(keyword)
  })
})
const roleModalDetailRole = computed(() => allRoles.find((role) => role.id === roleModal.detailRoleId) || null)
const roleCardDetailRole = computed(() => allRoles.find((role) => role.id === roleCardDetail.roleId) || null)
const roleCardSelectedDataIds = computed(() => {
  const role = roleCardDetailRole.value
  if (!role) return []
  return role.dataPermissionIds.filter((id) => isRoleCardDataSelected(id))
})
const userRoleModalDetailRole = computed(() => allRoles.find((role) => role.id === userRoleModal.detailRoleId) || null)
const selectedFunctionPermissions = computed(() => selectedFunctionPermissionIds.value.map(functionPermissionDetail).filter(Boolean))
const selectedDataPermissionDetails = computed(() => selectedDataPermissionIds.value
  .map((id) => {
    const permission = findDataPermission(id)
    if (!permission) return null
    return {
      ...permission,
      source: copiedDataSourceMap[id] || (manualDataPermissionIds.value.includes(id) ? '本次新增' : '')
    }
  })
  .filter(Boolean))
const selectedDataTree = computed(() => buildSelectedDataTree())
const manualDataPermissionDetails = computed(() => manualDataPermissionIds.value.map((id) => findDataPermission(id)).filter(Boolean))
const copiedDataPermissions = computed(() => Object.entries(copiedDataSourceMap).filter(([id]) => selectedDataPermissionIds.value.includes(id)).map(([id, source]) => {
  const permission = findDataPermission(id)
  return permission ? { ...permission, source } : null
}).filter(Boolean))
const copiedUserGrantedDataPermissions = computed(() => Object.entries(copiedDataSourceMap).filter(([id, source]) => source === '用户单独授权' && selectedDataPermissionIds.value.includes(id)).map(([id]) => findDataPermission(id)).filter(Boolean))
const hasCopiedUserGrantedData = computed(() => Object.values(copiedDataSourceMap).includes('用户单独授权'))
const hasPermissionSources = computed(() => selectedRoles.value.length > 0 || !!copiedFromUser.value || manualDataPermissionDetails.value.length > 0)

function findUserByItcodeOrName(itcode = '') {
  if (!permissionUserDirectoryReady) return null
  const normalized = parseApproverItcode(itcode).toLowerCase()
  return users.find((item) => [item.loginAccount, item.userAccount, item.name].some((value) => String(value || '').toLowerCase() === normalized)) || null
}

function sortedUnique(values = []) {
  return [...new Set((values || []).filter(Boolean))].sort()
}

function roleObjectsForIds(roleIds = [], rolePool = allRoles) {
  const selectedIds = new Set(roleIds || [])
  return rolePool.filter((role) => selectedIds.has(role.id))
}

function roleConflictMessage(conflicts = []) {
  const conflict = conflicts[0]
  if (!conflict) return ''
  const roleNames = conflict.roleNames.map((name) => '“' + name + '”').join('、')
  const suffix = conflicts.length > 1 ? '等 ' + conflicts.length + ' 个数据集' : ''
  return '角色 ' + roleNames + ' 在数据集“' + conflict.datasetName + '”' + suffix + '上的自定义权限不一致，请移除其中一个角色或先统一角色权限。'
}

function usersConflictedByRoleCandidate(candidateRole) {
  if (!candidateRole?.id) return []
  const rolePool = allRoles.map((role) => role.id === candidateRole.id ? candidateRole : role)
  return users.filter((user) => (user.roleIds || []).includes(candidateRole.id)
    && detectCustomDataRoleConflicts(roleObjectsForIds(user.roleIds, rolePool)).length)
}

function normalizeTenantList(value) {
  if (Array.isArray(value)) return sortedUnique(value)
  return value ? [value] : []
}

function normalizeOrganizationList(value) {
  if (Array.isArray(value)) return sortedUnique(value)
  return value ? [value] : []
}

function tenantListText(value, fallback = '未设置') {
  const tenants = normalizeTenantList(value)
  return tenants.length ? tenants.join('、') : fallback
}

function toggleApplicationTenant(tenant) {
  toggleId(form.tenant, tenant)
  formErrors.tenant = ''
}


function formatNameList(values = [], fallback = '无') {
  const list = sortedUnique(values).filter(Boolean)
  return list.length ? list.join('、') : fallback
}

function userPermissionBaselineByItcode(itcode = '') {
  const emptyBaseline = { roleIds: [], functionIds: [], dataIds: [], tenant: [] }
  if (!permissionUserDirectoryReady) return emptyBaseline
  const user = findUserByItcodeOrName(itcode)
  if (!user) return emptyBaseline
  return {
    roleIds: sortedUnique(user.roleIds || []),
    functionIds: sortedUnique(userInheritedFunctionIds(user)),
    dataIds: sortedUnique(userInheritedDataIds(user).concat(user.extraDataPermissionIds || [])),
    tenant: normalizeTenantList(user.tenant)
  }
}

function currentPermissionSnapshotBase() {
  return {
    selectedRoleIds: [...selectedRoleIds.value],
    copiedFromItcode: copiedFromItcode.value,
    copiedRoleIds: [...copiedRoleIds.value],
    selectedFunctionPermissionIds: [...selectedFunctionPermissionIds.value],
    selectedDataPermissionIds: [...selectedDataPermissionIds.value],
    manualDataPermissionIds: [...manualDataPermissionIds.value],
    copiedDataSourceMap: { ...copiedDataSourceMap }
  }
}

function buildPermissionChangeSummary(snapshot = null, options = {}) {
  const sourceSnapshot = snapshot || currentPermissionSnapshotBase()
  const baseline = options.baseline || userPermissionBaselineByItcode(options.targetItcode || form.targetItcode || form.targetUser)
  const tenant = options.tenant ?? form.tenant
  const copiedUser = sourceSnapshot.copiedFromItcode ? (copyableUsers.find((user) => user.itcode === sourceSnapshot.copiedFromItcode) || null) : null
  const roleIds = sortedUnique([...(sourceSnapshot.selectedRoleIds || []), ...(sourceSnapshot.copiedRoleIds || [])])
  const functionIds = sortedUnique(sourceSnapshot.selectedFunctionPermissionIds || [])
  const dataIds = sortedUnique(sourceSnapshot.selectedDataPermissionIds || [])
  const changedKeys = new Set(permissionScopeDiff(
    { tenantIds: normalizeTenantList(tenant), roleIds, functionIds, dataIds },
    { tenantIds: normalizeTenantList(baseline.tenant), roleIds: baseline.roleIds || [], functionIds: baseline.functionIds || [], dataIds: baseline.dataIds || [] }
  ))
  const items = []

  if (changedKeys.has('roleIds')) {
    items.push({ key: 'roles', label: '角色变化', detail: '由“' + formatNameList(roleNamesForIds(baseline.roleIds || [])) + '”调整为“' + formatNameList(roleNamesForIds(roleIds)) + '”。' })
  }
  if (changedKeys.has('functionIds')) {
    items.push({ key: 'functions', label: '功能权限变化', detail: '由 ' + formatNameList((baseline.functionIds || []).map(permissionName)) + ' 调整为 ' + formatNameList(functionIds.map(permissionName)) + '。' })
  }
  if (changedKeys.has('dataIds')) {
    items.push({ key: 'data', label: '数据权限变化', detail: '由 ' + formatNameList((baseline.dataIds || []).map((id) => findDataPermission(id)?.name || id)) + ' 调整为 ' + formatNameList(dataIds.map((id) => findDataPermission(id)?.name || id)) + '。' })
  }
  if (sourceSnapshot.copiedFromItcode && ['roleIds', 'functionIds', 'dataIds'].some((key) => changedKeys.has(key))) {
    const copiedName = copiedUser ? copiedUser.name + '（' + copiedUser.itcode + '）' : sourceSnapshot.copiedFromItcode
    items.push({ key: 'copy', label: '复制他人角色', detail: '本次复制 ' + copiedName + ' 的角色及角色对应的功能、数据权限，并复制用户单独授权的数据权限；未复制租户、组织和账号资料。' })
  }
  if (changedKeys.has('tenantIds')) {
    items.push({ key: 'tenant', label: '所属租户变化', detail: '由“' + tenantListText(baseline.tenant) + '”调整为“' + tenantListText(tenant) + '”。' })
  }
  return items
}

const scopeSummaryText = computed(() => {
  if (isPasswordResetRequest.value) return '账号安全操作，不涉及权限范围变更'
  if (isAccountStatusRequest.value) return '提交后自动生成申请单号'
  return `${allSelectedRoles.value.length} 个角色、${selectedFunctionPermissions.value.length} 项功能权限、${selectedDataPermissionDetails.value.length} 项数据权限`
})
const executionSummaryText = computed(() => `${selectedType.value.label} · ${isPasswordResetRequest.value ? form.applicant : (targetPrincipal.value || '待补充被申请人')} · ${scopeSummaryText.value}`)
const confirmationText = computed(() => `${form.relation.contact}，组织为 ${form.relation.org}，角色为 ${allSelectedRoles.value.map((role) => role.name).join('、') || '待选择'}，数据权限 ${selectedDataPermissionDetails.value.length} 项。`)
const approvalNodes = computed(() => {
  const nodes = [
    { label: '申请人提交', owner: form.applicant, done: true }
  ]
  if (isAccountStatusRequest.value) {
    nodes.push({ label: '系统管理员审批', owner: form.systemApprover, done: false })
    return nodes.map((node, index) => ({ ...node, step: String(index + 1) }))
  }
  if (isExternalApplicant.value) {
    nodes.push({ label: '关联人审批', owner: form.relatedAccount || '待填写关联人员', done: false })
  } else {
    if (isExternalPerson.value && !samePrincipal(form.relatedAccount, form.itcode)) {
      nodes.push({ label: '关联人审批', owner: form.relatedAccount || '待填写关联人员', done: false })
    }
    nodes.push({ label: '申请人直线经理审批', owner: form.applicantManager || '待带出', done: false })
    if (isInternalPerson.value && !isSelfApplication.value) {
      nodes.push({ label: '被申请人直线经理审批', owner: form.targetManager || '待带出', done: false })
    }
  }
  if (hasPermissionScopeStep.value) {
    const businessOwners = createBusinessApprovalTasks(createPermissionSnapshot()).map((task) => task.approver)
    nodes.push({ label: '业务负责人审批', owner: businessOwners.join('、') || '请先选择业务负责人', done: false })
  }
  nodes.push({ label: '系统自动生效', owner: '全部必要审批通过后整体生效', done: false })
  return nodes.map((node, index) => ({ ...node, step: String(index + 1) }))
})
const handlerCandidateOptions = computed(() => {
  const values = new Set()
  approvals.value.forEach((row) => {
    ;[row.approverItcode, row.applicantItcode, row.targetItcode, row.applicantManager, row.targetManager, row.systemApprover, ...row.handlers].forEach((item) => {
      if (item) values.add(parseApproverItcode(item))
    })
  })
  copyableUsers.forEach((user) => values.add(user.itcode))
  users.forEach((user) => values.add(user.loginAccount))
  businessApprovers.forEach((item) => values.add(parseApproverItcode(item)))
  return [...values].filter(Boolean).sort((a, b) => a.localeCompare(b))
})
const handlerSuggestions = computed(() => {
  const keyword = approvalSearch.handlerDraft.trim().toLowerCase()
  if (!keyword) return handlerCandidateOptions.value.filter((item) => !isApprovalHandlerSelected(item)).slice(0, 8)
  return handlerCandidateOptions.value
    .filter((item) => item.toLowerCase().includes(keyword) && !isApprovalHandlerSelected(item))
    .slice(0, 8)
})
const showHandlerSuggestions = computed(() => approvalSearch.handlerFocused && handlerSuggestions.value.length > 0)
const handlerInputPlaceholder = computed(() => approvalSearch.handlers.length ? '继续输入 ITCode' : '输入处理人 ITCode')
const approvalReadonlyViewer = computed(() => ['applicant', 'target'].includes(approvalSearch.viewer))
const approvalVisibleFilters = computed(() => approvalFilters)
const filteredApprovals = computed(() => {
  const approverKeyword = approvalSearch.approverItcode.trim().toLowerCase()
  return approvals.value.filter((row) => {
    const statusMatched = approvalSearch.status === '全部' || approvalDisplayStatus(row) === approvalSearch.status
    const handledByApprover = (row.approvalLogs || []).some((log) => samePrincipal(log.operator, approverKeyword))
    const approverMatched = !approverKeyword || row.approverItcode.toLowerCase().includes(approverKeyword) || handledByApprover
    const handlersMatched = !approvalSearch.handlers.length || approvalSearch.handlers.some((handler) => row.handlers.some((item) => item.toLowerCase().includes(handler.toLowerCase())))
    const demoNodeMatched = !currentDemoIdentity.value.nodeTypes.length || currentDemoIdentity.value.nodeTypes.includes(row.nodeType)
    const mailRoleMatched = approvalRowVisibleInMailContext(row)
    return statusMatched && approverMatched && handlersMatched && demoNodeMatched && mailRoleMatched
  })
})
const activeApproval = computed(() => approvals.value.find((row) => row.id === approvalWorkspace.rowId) || null)
const submittedApproval = computed(() => approvals.value.find((row) => row.id === approvalNotificationModal.rowId) || null)
const currentDemoApproval = computed(() => {
  const candidates = [
    activeApproval.value,
    submittedApproval.value,
    approvals.value.find((row) => row.id === approvalDeepLinkTicket.value),
    approvals.value.find((row) => row.statusKey === 'pending')
  ]
  return candidates.find((row) => row?.statusKey === 'pending') || null
})
const demoApprovalRouteSteps = computed(() => buildDemoApprovalRouteSteps(currentDemoApproval.value))
const demoRouteBeforeExpanded = ref(false)
const demoRouteAfterExpanded = ref(false)
const demoApprovalRouteItems = computed(() => createPermissionDemoRouteItems(demoApprovalRouteSteps.value, {
  beforeExpanded: demoRouteBeforeExpanded.value,
  afterExpanded: demoRouteAfterExpanded.value
}))
const activeApprovalNotifications = computed(() => activeApproval.value?.notificationLogs || [])
const activeApprovalFullRouteSteps = computed(() => buildDemoApprovalRouteSteps(activeApproval.value))

watch(() => currentDemoApproval.value?.id, () => {
  demoRouteBeforeExpanded.value = false
  demoRouteAfterExpanded.value = false
})
const activeApprovalBasicFields = computed(() => {
  if (!activeApproval.value) return []
  const row = activeApproval.value
  const infoSchema = resolveApplicationInfoSchema(row.typeKey, row.personType)
  const targetFields = infoSchema
    ? [
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.targetItcode) ? [{ label: '被申请人 ITCode', value: row.targetItcode }] : []),
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.targetUser) ? [{ label: '被申请人用户名', value: row.target }] : [])
      ]
    : [{ label: '被申请人', value: `${row.target}（${row.targetItcode}）` }]
  const identityFields = infoSchema
    ? [
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.relatedAccount) ? [{ label: '关联人 ITCode', value: row.relatedAccount }] : []),
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.mobile) ? [{ label: '被申请人手机号', value: row.mobile || '未填写' }] : []),
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.email) ? [{ label: '被申请人邮箱', value: row.email || '未填写' }] : []),
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.applicantManager) && row.applicantPersonType !== 'external' ? [{ label: '申请人直线经理', value: row.applicantManager }] : []),
        ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.targetManager) ? [{ label: '被申请人直线经理', value: row.targetManager }] : [])
      ]
    : [
        { label: '关联账号 / 关联人员', value: row.relatedAccount || '无' },
        ...(row.applicantPersonType !== 'external' ? [{ label: '申请人直线经理', value: row.applicantManager }] : []),
        ...(row.personType !== 'external' ? [{ label: '被申请人直线经理', value: row.targetManager }] : [])
      ]
  const fields = [
    { label: '申请单号', value: row.id },
    ...(schemaHasField(infoSchema, APPLICATION_INFO_FIELD.businessApprover) ? [{ label: '业务负责人', value: businessApproverLabel(row.businessApprover) }] : []),
    ...(row.sourceApplicationNo ? [{ label: '原申请单号', value: row.sourceApplicationNo }] : []),
    { label: '申请类型', value: row.type },
    infoSchema
      ? { label: '申请人用户名/ITCode', value: `${row.applicant} / ${row.applicantItcode}` }
      : { label: '申请人', value: `${row.applicant}（${row.applicantItcode}）` },
    ...targetFields,
    { label: '人员类型', value: row.personType === 'external' ? '外部人员' : '内部人员' },
    ...identityFields,
    { label: '当前审批人', value: pendingBusinessApprovers(row).length ? pendingBusinessApprovers(row).join('、') : row.approverItcode },
    { label: '处理人', value: row.handlers.join('、') },
    { label: '申请原因', value: row.reason || '未填写' }
  ]
  if (row.typeKey === 'create') fields.push({ label: '初始密码', value: row.passwordConfigured ? '已设置' : '未设置' })
  if (row.businessInfo?.organizations?.length) fields.push({ label: '所属组织', value: row.businessInfo.organizations.join('、') })
  if (normalizeTenantList(row.businessInfo?.tenant).length) fields.push({ label: '所属租户', value: tenantListText(row.businessInfo.tenant) })
  return fields
})
const canEditApprovalPermission = computed(() => approvalWorkspace.mode === 'approve' && ['applicant-manager', 'target-manager'].includes(approvalWorkspace.nodeType))
const canEditBusinessOwnership = computed(() => approvalWorkspace.mode === 'approve' && approvalWorkspace.nodeType === 'business')
const activeApprovalBusinessTasks = computed(() => activeApproval.value?.businessApprovalTasks || [])
const businessApprovalProgressText = computed(() => {
  const tasks = activeApprovalBusinessTasks.value
  if (!tasks.length) return '本单暂未生成业务负责人审批任务。'
  const approved = tasks.filter((task) => task.status === 'approved').length
  const pending = tasks.filter((task) => task.status === 'pending').map((task) => task.approver).join('、') || '无'
  return '已通过 ' + approved + ' 人，待审批 ' + (tasks.length - approved) + ' 人：' + pending
})
const activeApprovalChangeSummary = computed(() => activeApproval.value?.permissionSnapshot?.changeSummary || [])
const activeApprovalHasPermission = computed(() => activeApprovalChangeSummary.value.length > 0)
const activeApprovalPermissionSummary = computed(() => activeApprovalChangeSummary.value.length ? activeApprovalChangeSummary.value.length + ' 类权限变更' : '未检测到权限变更内容')
const approvalResultOptions = computed(() => [
  { value: 'agree', label: '同意' },
  { value: 'reject', label: '驳回' }
])
const approvalDecisionTitle = computed(() => {
  if (approvalWorkspace.nodeType === 'relation') return '关联确认'
  if (approvalWorkspace.nodeType === 'applicant-manager') return '申请人直线经理审批'
  if (approvalWorkspace.nodeType === 'target-manager') return '被申请人直线经理审批'
  return '业务负责人审批'
})
const approvalDecisionHint = computed(() => {
  if (approvalWorkspace.nodeType === 'relation') return '关联人只能确认关系并填写审批意见，申请信息和权限信息不可编辑。'
  if (approvalWorkspace.nodeType === 'applicant-manager') return rowNeedsTargetManager(activeApproval.value)
    ? '申请人直线经理确认申请合理性，通过后流转给被申请人直线经理。'
    : '申请人直线经理确认申请合理性，通过后流转给全部业务负责人。'
  if (approvalWorkspace.nodeType === 'target-manager') return '被申请人直线经理确认最终权限范围后，流转至申请中指定的业务负责人。'
  if (approvalWorkspace.nodeType === 'system-admin') return '系统管理员确认启用、禁用等需要实际管理操作的账号申请。'
  return '业务负责人需确认本申请的所属组织，权限范围只读不可修改。'
})
const approvalSubmitImpact = computed(() => {
  if (!approvalWorkspace.result) return '请选择审批结果后提交。'
  if (approvalWorkspace.result === 'reject') return '申请将退回申请人修改，列表状态变为已驳回。'
  if (approvalWorkspace.nodeType === 'relation') return activeApproval.value?.applicantPersonType === 'external'
    ? '关联人确认通过后，申请进入全部业务负责人审批。'
    : '关联人确认通过后，申请进入申请人直线经理审批。'
  if (approvalWorkspace.nodeType === 'applicant-manager') return rowNeedsTargetManager(activeApproval.value)
    ? '申请人直线经理审批通过后，申请进入被申请人直线经理审批。'
    : '申请人直线经理审批通过后，申请进入全部业务负责人审批。'
  if (approvalWorkspace.nodeType === 'target-manager') return '被申请人直线经理审批通过后，流转至申请中指定的业务负责人。'
  if (approvalWorkspace.nodeType === 'system-admin') return '系统管理员确认通过后，系统执行启用或禁用等账号管理操作并记录结果。'
  return '当前业务负责人审批通过后，若仍有人待审则继续等待；全部通过后权限一次性自动生效。'
})

function approvalChangeSummaryText(row) {
  const items = row?.permissionSnapshot?.changeSummary || []
  if (!items.length) return '无权限变化'
  return items.map((item) => item.label).join('、')
}


function resetFunctionDirectoryEditorErrors() {
  functionDirectoryEditor.errors.parentId = ''
  functionDirectoryEditor.errors.name = ''
  functionDirectoryEditor.errors.path = ''
  functionDirectoryEditor.errors.order = ''
  functionDirectoryEditor.errors.description = ''
  functionDirectoryEditor.notice = ''
}

function resetFunctionMenuEditorErrors() {
  functionMenuEditor.errors.rootId = ''
  functionMenuEditor.errors.parentId = ''
  functionMenuEditor.errors.name = ''
  functionMenuEditor.errors.path = ''
  functionMenuEditor.errors.code = ''
  functionMenuEditor.errors.order = ''
  functionMenuEditor.errors.description = ''
  functionMenuEditor.notice = ''
}

function menuSlugFromName(name) {
  const text = String(name || 'menu').trim().toLowerCase()
  const ascii = text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return ascii || `menu-${Date.now()}`
}

function flattenFunctionDirectories() {
  return functionMenuTree.flatMap((root) => [
    { node: root, parent: null, root, level: 1, path: root.name },
    ...root.children
      .filter((child) => child.nodeType === 'directory')
      .map((child) => ({ node: child, parent: root, root, level: 2, path: `${root.name} / ${child.name}` }))
  ])
}

function findFunctionDirectory(id) {
  return flattenFunctionDirectories().find((item) => item.node.id === id) || null
}

function findFunctionMenuNode(id) {
  for (const root of functionMenuTree) {
    for (const child of root.children) {
      if (child.nodeType === 'menu' && child.id === id) return { node: child, parent: root, root, path: functionMenuFullPath(root, child) }
      if (child.nodeType === 'directory') {
        const leaf = child.children.find((item) => item.nodeType === 'menu' && item.id === id)
        if (leaf) return { node: leaf, parent: child, root, path: functionMenuFullPath(root, child, leaf) }
      }
    }
  }
  return null
}

function functionMenuPathMap() {
  return new Map(allFunctionMenuLeaves().map(({ root, child, leaf }) => [leaf.id, functionMenuFullPath(root, child, leaf)]))
}

function syncManagedFunctionMenus(oldMap, newMap) {
  const pathMap = new Map()
  oldMap.forEach((oldPath, id) => {
    const newPath = newMap.get(id)
    if (newPath && newPath !== oldPath) pathMap.set(oldPath, newPath)
  })
  if (!pathMap.size) return
  managedFunctions.forEach((item) => {
    if (pathMap.has(item.menu)) item.menu = pathMap.get(item.menu)
  })
}

function allFunctionMenuLeaves(scopeRoot = null) {
  const roots = scopeRoot ? [scopeRoot] : functionMenuTree
  return roots.flatMap((root) => root.children.flatMap((child) => {
    if (child.nodeType === 'menu') return [{ root, child, leaf: child }]
    return child.children.filter((leaf) => leaf.nodeType === 'menu').map((leaf) => ({ root, child, leaf }))
  }))
}

function functionMenuSortIndex(menu) {
  const index = allFunctionMenuLeaves().findIndex(({ root, child, leaf }) => functionMenuFullPath(root, child, leaf) === menu || functionMenuFullPath(root, child) === menu)
  return index >= 0 ? index : 9999
}

function initFunctionDirectoryDraft(parentId = '') {
  resetFunctionDirectoryEditorErrors()
  const selectedRoot = functionMenuTree.find((root) => root.name === functionFilters.root)
  functionDirectoryEditor.draft = {
    ...emptyFunctionDirectoryDraft(),
    parentId: parentId || selectedRoot?.id || '__root__',
    order: (selectedRoot?.children?.filter((item) => item.nodeType === 'directory').length || functionMenuTree.length) + 1
  }
}

function initFunctionMenuDraft(parentId = '') {
  resetFunctionMenuEditorErrors()
  const selectedRoot = functionMenuTree.find((root) => root.name === functionFilters.root)
  const fallbackDirectory = selectedRoot || functionMenuTree[0]
  const directoryId = parentId || fallbackDirectory?.id || ''
  const directory = findFunctionDirectory(directoryId)
  functionMenuEditor.draft = {
    ...emptyFunctionMenuDraft(),
    rootId: directory?.root?.id || fallbackDirectory?.id || '',
    parentId: directoryId,
    code: '',
    status: 'enabled',
    order: (directory?.node?.children?.filter((item) => item.nodeType === 'menu').length || 0) + 1
  }
}

function initFunctionDraft(menuPath = '') {
  resetFunctionEditorErrors()
  functionEditor.visible = false
  functionEditor.mode = 'create'
  functionEditor.functionId = ''
  functionEditor.menuPickerOpen = false
  functionEditor.draft = emptyFunctionDraft()
  const selectedMenu = menuPath || (functionFilters.root && functionFilters.menu ? `${functionFilters.root} / ${functionFilters.menu}` : '')
  if (selectedMenu) functionEditor.draft.menu = selectedMenu
  setFunctionMenuPickerByMenu(functionEditor.draft.menu)
}

function openFunctionCreateModal(tab = 'function') {
  functionMenuEditor.visible = true
  functionMenuEditor.mode = 'create'
  functionMenuEditor.targetId = ''
  functionDirectoryEditor.mode = 'create'
  functionDirectoryEditor.targetId = ''
  switchFunctionCreateTab(tab)
}

function openFunctionMenuEditor() {
  openFunctionCreateModal('menu')
}

function switchFunctionCreateTab(tab) {
  functionCreateTab.value = tab
  if (tab === 'directory') initFunctionDirectoryDraft()
  if (tab === 'menu') initFunctionMenuDraft()
  if (tab === 'function') initFunctionDraft()
}

function closeFunctionMenuEditor() {
  functionMenuEditor.visible = false
  functionMenuEditor.notice = ''
  functionEditor.menuPickerOpen = false
}

function syncFunctionMenuEditorRoot() {
  const root = functionMenuEditorRoot.value
  functionMenuEditor.draft.parentId = root?.children?.[0]?.id || ''
}

function validateFunctionDirectoryEditor() {
  resetFunctionDirectoryEditorErrors()
  const draft = functionDirectoryEditor.draft
  const parent = draft.parentId === '__root__' ? null : findFunctionDirectory(draft.parentId)
  const editingDirectory = functionDirectoryEditor.mode === 'edit' ? findFunctionDirectory(functionDirectoryEditor.targetId) : null
  if (!draft.parentId) functionDirectoryEditor.errors.parentId = '请选择上级目录。'
  if (draft.parentId !== '__root__' && !parent) functionDirectoryEditor.errors.parentId = '请选择有效的上级目录。'
  if (parent?.level >= 2) functionDirectoryEditor.errors.parentId = '目录最多两级，请选择根目录或一级目录。'
  if (editingDirectory && draft.parentId === editingDirectory.node.id) functionDirectoryEditor.errors.parentId = '上级目录不能选择自身。'
  if (editingDirectory?.level === 1 && draft.parentId !== '__root__' && editingDirectory.node.children.some((item) => item.nodeType === 'directory')) functionDirectoryEditor.errors.parentId = '当前目录已有下级目录，不能移动到二级目录下。'
  if (!draft.name) functionDirectoryEditor.errors.name = '请填写目录名称。'
  if (!draft.path) functionDirectoryEditor.errors.path = '请填写目录路由。'
  if (!Number(draft.order)) functionDirectoryEditor.errors.order = '请填写目录排序。'
  if (!draft.description) functionDirectoryEditor.errors.description = '请填写目录描述。'
  const siblings = draft.parentId === '__root__' ? functionMenuTree : (parent?.node?.children || []).filter((item) => item.nodeType === 'directory')
  if (draft.name && siblings.some((item) => item.id !== functionDirectoryEditor.targetId && item.name === draft.name)) functionDirectoryEditor.errors.name = '同一上级目录下已存在同名目录。'
  if (draft.path && flattenFunctionDirectories().some((item) => item.node.id !== functionDirectoryEditor.targetId && item.node.path === draft.path)) functionDirectoryEditor.errors.path = '该目录路由已存在，请换一个路由。'
  return !Object.values(functionDirectoryEditor.errors).some(Boolean)
}

function saveFunctionDirectoryEditor() {
  const draft = functionDirectoryEditor.draft
  if (!validateFunctionDirectoryEditor()) return
  if (functionDirectoryEditor.mode === 'edit') {
    const target = findFunctionDirectory(functionDirectoryEditor.targetId)
    const nextParent = draft.parentId === '__root__' ? null : findFunctionDirectory(draft.parentId)
    if (!target) return
    const oldMap = functionMenuPathMap()
    const oldContainer = target.parent ? target.parent.children : functionMenuTree
    const oldIndex = oldContainer.findIndex((item) => item.id === target.node.id)
    if (oldIndex >= 0) oldContainer.splice(oldIndex, 1)
    Object.assign(target.node, {
      name: draft.name,
      path: draft.path,
      order: Number(draft.order),
      description: draft.description,
      code: target.node.code || `directory.${menuSlugFromName(draft.name).replace(/-/g, '.')}`
    })
    const nextContainer = nextParent ? nextParent.node.children : functionMenuTree
    nextContainer.push(target.node)
    nextContainer.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    syncManagedFunctionMenus(oldMap, functionMenuPathMap())
    selectedFunctionId.value = target.node.id
    functionFilters.root = nextParent?.root?.name || target.node.name
    showFunctionNotice(`已保存目录“${draft.name}”。`)
    closeFunctionMenuEditor()
    return
  }
  const idBase = `dir-${menuSlugFromName(draft.name)}`
  let nextId = idBase
  while (flattenFunctionDirectories().some((item) => item.node.id === nextId)) nextId = `${idBase}-${Date.now()}`
  const nextDirectory = {
    id: nextId,
    name: draft.name,
    path: draft.path,
    code: `directory.${menuSlugFromName(draft.name).replace(/-/g, '.')}`,
    order: Number(draft.order),
    status: 'enabled',
    description: draft.description,
    nodeType: 'directory',
    children: []
  }
  if (draft.parentId === '__root__') {
    functionMenuTree.push(nextDirectory)
    functionMenuTree.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    functionFilters.root = nextDirectory.name
  } else {
    const parent = findFunctionDirectory(draft.parentId)
    parent?.node.children.push(nextDirectory)
    parent?.node.children.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    functionFilters.root = parent?.root?.name || ''
  }
  selectedFunctionId.value = nextDirectory.id
  showFunctionNotice(`已新增目录“${draft.name}”。`)
  functionCreateTab.value = 'menu'
  initFunctionMenuDraft(nextId)
}

function validateFunctionMenuEditor() {
  resetFunctionMenuEditorErrors()
  const draft = functionMenuEditor.draft
  const directory = findFunctionDirectory(draft.parentId)
  if (!directory) functionMenuEditor.errors.parentId = '请选择所属目录。'
  if (!draft.name) functionMenuEditor.errors.name = '请填写菜单名称。'
  if (!draft.path) functionMenuEditor.errors.path = '请填写菜单路由。'
  if (!Number(draft.order)) functionMenuEditor.errors.order = '请填写菜单排序。'
  if (!draft.description) functionMenuEditor.errors.description = '请填写菜单描述。'
  const leaves = allFunctionMenuLeaves()
  if (draft.name && directory?.node.children.some((leaf) => leaf.id !== functionMenuEditor.targetId && leaf.nodeType === 'menu' && leaf.name === draft.name)) functionMenuEditor.errors.name = '同一所属目录下已存在同名菜单。'
  if (draft.path && leaves.some(({ leaf }) => leaf.id !== functionMenuEditor.targetId && leaf.path === draft.path)) functionMenuEditor.errors.path = '该菜单路由已存在，请换一个路由。'
  return !Object.values(functionMenuEditor.errors).some(Boolean)
}

function saveFunctionMenuEditor() {
  const draft = functionMenuEditor.draft
  if (!draft.code && draft.name) draft.code = `menu.${menuSlugFromName(draft.name).replace(/-/g, '.')}`
  if (!validateFunctionMenuEditor()) return
  const directory = findFunctionDirectory(draft.parentId)
  if (!directory) return
  if (functionMenuEditor.mode === 'edit') {
    const target = findFunctionMenuNode(functionMenuEditor.targetId)
    if (!target) return
    const oldMap = functionMenuPathMap()
    const oldIndex = target.parent.children.findIndex((item) => item.id === target.node.id)
    if (oldIndex >= 0) target.parent.children.splice(oldIndex, 1)
    Object.assign(target.node, {
      name: draft.name,
      path: draft.path,
      code: draft.code,
      order: Number(draft.order),
      status: draft.status || target.node.status || 'enabled',
      description: draft.description
    })
    directory.node.children.push(target.node)
    directory.node.children.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    syncManagedFunctionMenus(oldMap, functionMenuPathMap())
    functionFilters.root = directory.root.name
    functionFilters.menu = target.node.name
    selectedFunctionId.value = target.node.id
    showFunctionNotice(`已保存菜单“${draft.name}”。`)
    closeFunctionMenuEditor()
    return
  }
  const idBase = draft.code.replace(/[^a-zA-Z0-9_-]+/g, '-') || `menu-${Date.now()}`
  let nextId = idBase
  while (allFunctionMenuLeaves().some(({ leaf }) => leaf.id === nextId)) nextId = `${idBase}-${Date.now()}`
  const nextMenu = {
    id: nextId,
    name: draft.name,
    path: draft.path,
    code: draft.code,
    order: Number(draft.order),
    status: 'enabled',
    description: draft.description,
    nodeType: 'menu',
    children: []
  }
  directory.node.children.push(nextMenu)
  directory.node.children.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
  functionFilters.root = directory.root.name
  functionFilters.menu = nextMenu.name
  const menuPath = directory.parent ? functionMenuFullPath(directory.root, directory.node, nextMenu) : functionMenuFullPath(directory.root, nextMenu)
  selectedFunctionId.value = nextMenu.id
  showFunctionNotice(`已新增菜单“${draft.name}”。`)
  functionCreateTab.value = 'function'
  initFunctionDraft(menuPath)
}
function syncFunctionMenuFilter() {
  if (functionFilters.menu && !functionSecondMenuOptions.value.includes(functionFilters.menu)) {
    functionFilters.menu = ''
  }
}
function resetFunctionFilters() {
  functionFilters.name = ''
  functionFilters.root = ''
  functionFilters.menu = ''
  functionFilters.type = ''
  if (filteredManagedFunctions.value[0]) selectedFunctionId.value = filteredManagedFunctions.value[0].id
}

function selectManagedFunction(id) {
  selectedFunctionId.value = id
}

function openFunctionDetail(item) {
  selectedFunctionId.value = item.id
  functionDetailVisible.value = true
}

function closeFunctionDetail() {
  functionDetailVisible.value = false
}

function openFunctionStructureEditor(item) {
  selectedFunctionId.value = item.id
  if (item.itemKind === 'directory') {
    const directory = findFunctionDirectory(item.id)
    if (!directory) return
    functionMenuEditor.visible = true
    functionMenuEditor.mode = 'edit'
    functionMenuEditor.targetId = ''
    functionCreateTab.value = 'directory'
    resetFunctionDirectoryEditorErrors()
    functionDirectoryEditor.mode = 'edit'
    functionDirectoryEditor.targetId = item.id
    functionDirectoryEditor.draft = {
      parentId: directory.parent?.id || '__root__',
      name: directory.node.name,
      path: directory.node.path || '',
      order: Number(directory.node.order) || 10,
      description: directory.node.description || ''
    }
    return
  }
  if (item.itemKind === 'menu') {
    const menu = findFunctionMenuNode(item.id)
    if (!menu) return
    functionMenuEditor.visible = true
    functionMenuEditor.mode = 'edit'
    functionMenuEditor.targetId = item.id
    functionCreateTab.value = 'menu'
    resetFunctionMenuEditorErrors()
    functionMenuEditor.draft = {
      ...emptyFunctionMenuDraft(),
      rootId: menu.root.id,
      parentId: menu.parent.id,
      name: menu.node.name,
      path: menu.node.path || '',
      code: menu.node.code || '',
      order: Number(menu.node.order) || 10,
      status: menu.node.status || 'enabled',
      description: menu.node.description || ''
    }
  }
}

function toggleFunctionTreeRow(item) {
  if (!item?.hasChildren) return
  if (item.itemKind === 'directory') {
    const next = new Set(collapsedFunctionTreeIds.value)
    if (next.has(item.id)) next.delete(item.id)
    else next.add(item.id)
    collapsedFunctionTreeIds.value = next
    return
  }
  if (item.itemKind === 'menu') {
    const next = new Set(expandedFunctionMenuIds.value)
    if (next.has(item.id)) next.delete(item.id)
    else next.add(item.id)
    expandedFunctionMenuIds.value = next
  }
}

function expandFunctionTreeToMenu(menu) {
  const rows = functionCatalogRows.value
  const rowMap = new Map(rows.map((item) => [item.id, item]))
  const menuRow = rows.find((item) => item.itemKind === 'menu' && item.menu === menu)
  if (!menuRow) return
  const expandedMenus = new Set(expandedFunctionMenuIds.value)
  expandedMenus.add(menuRow.id)
  expandedFunctionMenuIds.value = expandedMenus
  const collapsedDirectories = new Set(collapsedFunctionTreeIds.value)
  let cursor = menuRow.parentId ? rowMap.get(menuRow.parentId) : null
  while (cursor) {
    if (cursor.itemKind === 'directory') collapsedDirectories.delete(cursor.id)
    cursor = cursor.parentId ? rowMap.get(cursor.parentId) : null
  }
  collapsedFunctionTreeIds.value = collapsedDirectories
}
function functionTypeLabel(value) {
  if (value === 'directory') return '目录'
  if (value === 'menu') return '菜单'
  return functionTypeOptions.find((option) => option.value === value)?.label || value
}

function functionStatusLabel(value) {
  return value === 'enabled' ? '启用' : '停用'
}

function functionUsage(item) {
  const id = item?.id
  if (!id) return { roles: [], users: [] }
  const roles = allRoles.filter((role) => role.functionPermissionIds.includes(id))
  const usersByAccount = new Map()
  users.forEach((user) => {
    const inherited = userRoles(user).some((role) => role.functionPermissionIds.includes(id))
    if (inherited) usersByAccount.set(user.userAccount, { ...user, source: '角色继承' })
  })
  return { roles, users: [...usersByAccount.values()] }
}

function emptyFunctionInterfaceDraft(order = 1) {
  return { id: nextFunctionInterfaceId(), order: String(order), name: '', url: '' }
}

function normalizeFunctionInterface(api = {}, index = 0) {
  return {
    id: api.id || nextFunctionInterfaceId(),
    order: api.order || String(index + 1),
    name: api.name || '',
    url: api.url || ''
  }
}

function cloneFunctionDraft(item) {
  const draft = emptyFunctionDraft()
  if (!item) return draft
  const next = { ...draft, ...JSON.parse(JSON.stringify(item)) }
  next.interfaces = (next.interfaces || []).map(normalizeFunctionInterface)
  if (!next.interfaces.length) next.interfaces = [emptyFunctionInterfaceDraft()]
  return next
}

function resetFunctionEditorErrors() {
  functionEditor.errors.menu = ''
  functionEditor.errors.name = ''
  functionEditor.errors.description = ''
  functionEditor.errors.type = ''
  functionEditor.errors.interfaces = ''
  functionEditor.notice = ''
}

function functionMenuFullPath(root, child, leaf) {
  return [root?.name, child?.name, leaf?.name].filter(Boolean).join(' / ')
}

function functionMenuLeafPath(root, child, leaf) {
  return child?.id === leaf?.id ? functionMenuFullPath(root, child) : functionMenuFullPath(root, child, leaf)
}

function setDataSourceMenuPickerByMenu(menu) {
  const rootName = functionMenuParts(menu).root || menu
  const root = functionMenuTree.find((item) => item.name === rootName) || functionMenuTree[0]
  dataSourceEditor.menuRootId = root?.id || ''
}

function selectDataSourceMenuRoot(id) {
  dataSourceEditor.menuRootId = id
  const root = functionMenuTree.find((item) => item.id === id)
  if (!root) return
  dataSourceEditor.draft.menu = root.name
  dataSourceEditor.menuPickerOpen = false
  dataSourceEditor.errors.menu = ''
}

function setFunctionMenuPickerByMenu(menu) {
  for (const root of functionMenuTree) {
    for (const child of root.children) {
      if (child.name === menu || functionMenuFullPath(root, child) === menu) {
        functionEditor.menuRootId = root.id
        functionEditor.menuChildId = child.id
        return
      }
      const leaf = child.children.find((item) => item.name === menu || functionMenuFullPath(root, child, item) === menu)
      if (leaf) {
        functionEditor.menuRootId = root.id
        functionEditor.menuChildId = child.id
        return
      }
    }
  }
  functionEditor.menuRootId = functionMenuTree[0]?.id || ''
  functionEditor.menuChildId = functionMenuTree[0]?.children?.[0]?.id || ''
}

function selectFunctionMenuRoot(id) {
  functionEditor.menuRootId = id
  const root = functionMenuTree.find((item) => item.id === id)
  functionEditor.menuChildId = root?.children?.[0]?.id || ''
}

function selectFunctionMenuChild(id) {
  functionEditor.menuChildId = id
  const root = activeFunctionMenuRoot.value
  const child = root?.children?.find((item) => item.id === id)
  if (child && !child.children.length) {
    functionEditor.draft.menu = functionMenuFullPath(root, child)
    functionEditor.menuPickerOpen = false
    functionEditor.errors.menu = ''
  }
}

function selectFunctionMenuLeaf(name) {
  const root = activeFunctionMenuRoot.value
  const child = activeFunctionMenuChild.value
  const leaf = activeFunctionMenuLeaves.value.find((item) => item.name === name)
  functionEditor.draft.menu = functionMenuFullPath(root, child, leaf)
  functionEditor.menuPickerOpen = false
  functionEditor.errors.menu = ''
}
function openFunctionEditor(mode, item = null) {
  resetFunctionEditorErrors()
  functionEditor.visible = true
  functionEditor.mode = mode
  functionEditor.functionId = item?.id || ''
  functionEditor.menuPickerOpen = false
  functionEditor.draft = cloneFunctionDraft(item)
  setFunctionMenuPickerByMenu(functionEditor.draft.menu)
}

function closeFunctionEditor() {
  functionEditor.visible = false
  functionEditor.notice = ''
}

function nextFunctionInterfaceId() {
  return 'api-manual-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}

function addFunctionInterface() {
  resetFunctionEditorErrors()
  functionEditor.draft.interfaces.push(emptyFunctionInterfaceDraft(functionEditor.draft.interfaces.length + 1))
}

function removeFunctionInterface(id) {
  functionEditor.draft.interfaces = functionEditor.draft.interfaces.filter((api) => api.id !== id)
}

function validateFunctionEditor() {
  resetFunctionEditorErrors()
  const draft = functionEditor.draft
  if (!draft.menu) functionEditor.errors.menu = '请选择所属菜单，方便后台人员理解功能归属。'
  if (!draft.name) functionEditor.errors.name = '请填写功能名称，名称会展示在功能列表和授权说明中。'
  if (!draft.description) functionEditor.errors.description = '请填写功能描述，说明该功能给谁使用、能做什么。'
  if (!draft.type) functionEditor.errors.type = '请选择类型：功能、按钮或 Skill。'
  const filledInterfaces = draft.interfaces.filter((api) => api.order || api.name || api.url)
  if (!filledInterfaces.length) {
    functionEditor.errors.interfaces = '请至少填写一个关联接口。'
  } else if (filledInterfaces.some((api) => !api.order || !api.name || !api.url)) {
    functionEditor.errors.interfaces = '请完整填写关联接口的排序、接口名称和接口地址。'
  }
  return !Object.values(functionEditor.errors).some(Boolean)
}

function functionCodeFromName(name) {
  const text = String(name || 'custom').trim().toLowerCase()
  const ascii = text.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')
  return `func.custom.${ascii || Date.now()}`
}

function saveFunctionEditor() {
  if (!validateFunctionEditor()) return
  const draft = cloneFunctionDraft(functionEditor.draft)
  draft.interfaces = draft.interfaces.filter((api) => api.order || api.name || api.url).map(normalizeFunctionInterface)
  if (functionEditor.mode === 'create') {
    draft.id = functionCodeFromName(draft.name)
    while (managedFunctions.some((item) => item.id === draft.id)) {
      draft.id = `func.custom.${Date.now()}`
    }
    managedFunctions.unshift(draft)
    if (!allFunctionPermissions.some((permission) => permission.id === draft.id)) {
      allFunctionPermissions.push({ id: draft.id, name: draft.name })
    }
    syncFunctionPermissionToTree(draft)
    selectedFunctionId.value = draft.id
    expandFunctionTreeToMenu(draft.menu)
    showFunctionNotice(`已新增“${draft.name}”，并同步生成可授权功能权限。`)
  } else {
    const index = managedFunctions.findIndex((item) => item.id === functionEditor.functionId)
    if (index >= 0) {
      managedFunctions.splice(index, 1, { ...managedFunctions[index], ...draft, id: managedFunctions[index].id })
      const permission = allFunctionPermissions.find((item) => item.id === managedFunctions[index].id)
      if (permission) permission.name = draft.name
      syncFunctionPermissionToTree(managedFunctions[index])
      selectedFunctionId.value = managedFunctions[index].id
      showFunctionNotice(`已保存“${draft.name}”，并同步更新角色可选功能权限。`)
    }
  }
  if (functionEditor.mode === 'create') closeFunctionMenuEditor()
  else closeFunctionEditor()
}

function deleteManagedFunctionFromRow(item) {
  selectedFunctionId.value = item.id
  deleteSelectedManagedFunction()
}

function deleteSelectedManagedFunction() {
  const item = selectedManagedFunction.value
  if (!item) return
  const usage = functionUsage(item)
  if (usage.roles.length || usage.users.length) {
    showFunctionNotice('该功能仍有关联角色或用户，当前 POC 不允许直接删除。请先调整授权后再删除。')
    return
  }
  if (!window.confirm(`确认删除“${item.name}”吗？删除后当前菜单管理列表将不再展示。`)) return
  const index = managedFunctions.findIndex((fn) => fn.id === item.id)
  if (index >= 0) managedFunctions.splice(index, 1)
  removeFunctionPermissionFromTree(item.id)
  selectedFunctionId.value = filteredManagedFunctions.value[0]?.id || ''
  showFunctionNotice(`已删除“${item.name}”，并移除对应功能权限。`)
}
function deleteManagedFunction() {
  const item = managedFunctions.find((fn) => fn.id === functionEditor.functionId)
  if (!item) return
  const usage = functionUsage(item)
  if (usage.roles.length || usage.users.length) {
    functionEditor.notice = '该功能仍有关联角色或用户，当前 POC 不允许直接删除。请先调整授权后再删除。'
    return
  }
  if (!window.confirm(`确认删除“${item.name}”吗？删除后当前菜单管理列表将不再展示。`)) return
  const index = managedFunctions.findIndex((fn) => fn.id === item.id)
  if (index >= 0) managedFunctions.splice(index, 1)
  removeFunctionPermissionFromTree(item.id)
  selectedFunctionId.value = filteredManagedFunctions.value[0]?.id || ''
  showFunctionNotice(`已删除“${item.name}”，并移除对应功能权限。`)
  closeFunctionEditor()
}

function clearFunctionNoticeTimer() {
  if (!functionNoticeTimer) return
  window.clearTimeout(functionNoticeTimer)
  functionNoticeTimer = null
}

function dismissFunctionNotice() {
  clearFunctionNoticeTimer()
  functionNotice.value = ''
}

function showFunctionNotice(message) {
  clearFunctionNoticeTimer()
  functionNotice.value = message
  functionNoticeTimer = window.setTimeout(() => {
    functionNotice.value = ''
    functionNoticeTimer = null
  }, 2800)
}
function resetDataSourceFilters() {
  dataSourceFilters.menu = ''
  dataSourceFilters.name = ''
  dataSourceFilters.sensitivity = ''
}

function dataSourceSensitivityLabel(value) {
  return dataSourceSensitivityOptions.find((option) => option.value === value)?.label || value
}

function dataSourceMenuPath(source) {
  const menu = source?.menu || legacyDataSourceGroupMenuMap[source?.group] || source?.group || ''
  return functionMenuParts(menu).root || menu
}

function dataSourceMatchesMenuFilter(source, filter) {
  if (!filter) return true
  return dataSourceMenuPath(source) === filter
}

function dataSourceTreeTypeLabel(row) {
  if (row.itemKind === 'directory') return row.depth === 0 ? '目录' : '子目录'
  if (row.itemKind === 'menu') return '页面'
  return '数据源'
}

function dataSourceCatalogStructureRows() {
  return functionCatalogStructureRows().map((item) => ({ ...item, sourceId: '', apiUrl: '', permissionParam: '', key: '', value: '', remark: '', sensitivity: '' }))
}

const dataSourceCatalogRows = computed(() => {
  const structureRows = dataSourceCatalogStructureRows()
  const rootSortMap = new Map(structureRows.filter((item) => item.itemKind === 'directory' && item.depth === 0).map((item) => [item.name, item]))
  const sourceRows = dataSources.map((source, index) => {
    const menu = dataSourceMenuPath(source)
    const parent = rootSortMap.get(menu)
    return {
      ...source,
      menu,
      group: functionMenuParts(menu).root || source.group,
      parentId: parent?.id || '',
      depth: (parent?.depth ?? 0) + 1,
      itemKind: 'source',
      type: 'datasource',
      sourceId: source.id,
      sortIndex: (parent?.sortIndex || 999000) + 100 + index
    }
  })
  const rows = [...structureRows, ...sourceRows].sort((a, b) => a.sortIndex - b.sortIndex || a.name.localeCompare(b.name, 'zh-Hans-CN'))
  const rowMap = new Map(rows.map((item) => [item.id, item]))
  const usedIds = new Set()
  sourceRows.forEach((source) => {
    let cursor = source
    while (cursor) {
      usedIds.add(cursor.id)
      cursor = cursor.parentId ? rowMap.get(cursor.parentId) : null
    }
  })
  const prunedRows = rows.filter((item) => usedIds.has(item.id))
  const parentIds = new Set(prunedRows.map((item) => item.parentId).filter(Boolean))
  return prunedRows.map((item) => ({ ...item, hasChildren: parentIds.has(item.id) }))
})

const dataSourceTreeChildCounts = computed(() => {
  const counts = new Map()
  dataSourceCatalogRows.value.forEach((item) => {
    if (!item.parentId) return
    counts.set(item.parentId, (counts.get(item.parentId) || 0) + 1)
  })
  return counts
})

function dataSourceTreeChildCount(item) {
  return dataSourceTreeChildCounts.value.get(item.id) || 0
}

function isDataSourceTreeExpanded(item) {
  if (!item?.hasChildren) return false
  if (item.itemKind === 'directory' || item.itemKind === 'menu') return !collapsedDataSourceTreeIds.value.has(item.id)
  return false
}

function isDataSourceTreeRowVisible(item, rowMap) {
  if (!item.parentId) return true
  const parent = rowMap.get(item.parentId)
  if (!parent) return true
  return isDataSourceTreeExpanded(parent) && isDataSourceTreeRowVisible(parent, rowMap)
}

const filteredDataSourceRows = computed(() => {
  const rows = dataSourceCatalogRows.value
  const rowMap = new Map(rows.map((item) => [item.id, item]))
  if (!hasDataSourceFilters.value) return rows.filter((item) => isDataSourceTreeRowVisible(item, rowMap))
  const matchedSourceIds = new Set(filteredDataSources.value.map((source) => source.id))
  const visibleIds = new Set()
  rows.forEach((item) => {
    if (item.itemKind !== 'source' || !matchedSourceIds.has(item.sourceId || item.id)) return
    let cursor = item
    while (cursor) {
      visibleIds.add(cursor.id)
      cursor = cursor.parentId ? rowMap.get(cursor.parentId) : null
    }
  })
  return rows.filter((item) => visibleIds.has(item.id))
})

const selectedDataSource = computed(() => dataSources.find((source) => source.id === selectedDataSourceId.value) || null)

function toggleDataSourceTreeRow(item) {
  if (!item?.hasChildren) return
  const next = new Set(collapsedDataSourceTreeIds.value)
  if (next.has(item.id)) next.delete(item.id)
  else next.add(item.id)
  collapsedDataSourceTreeIds.value = next
}

function handleDataSourceRowClick(row) {
  if (row.itemKind !== 'source') {
    toggleDataSourceTreeRow(row)
    return
  }
  openDataSourceDetail(row)
}

function closeDataSourceDetail() {
  dataSourceDetailVisible.value = false
}


function resetDataSourceEditorErrors() {
  dataSourceEditor.errors.menu = ''
  dataSourceEditor.errors.name = ''
  dataSourceEditor.errors.apiUrl = ''
  dataSourceEditor.errors.permissionParam = ''
  dataSourceEditor.errors.remark = ''
  dataSourceEditor.notice = ''
}

function cloneDataSourceDraft(source) {
  const draft = emptyDataSourceDraft()
  if (!source) return draft
  const menu = dataSourceMenuPath(source)
  return { ...draft, ...source, group: menu, menu }
}

function openDataSourceEditor(mode, source = null) {
  resetDataSourceEditorErrors()
  dataSourceEditor.visible = true
  dataSourceEditor.mode = mode
  dataSourceEditor.sourceId = source?.id || ''
  dataSourceEditor.menuPickerOpen = false
  dataSourceEditor.draft = cloneDataSourceDraft(source)
  setDataSourceMenuPickerByMenu(dataSourceEditor.draft.menu)
}

function closeDataSourceEditor() {
  dataSourceEditor.visible = false
  dataSourceEditor.menuPickerOpen = false
}

function validateDataSourceEditor() {
  resetDataSourceEditorErrors()
  const draft = dataSourceEditor.draft
  if (!draft.menu || !functionMenuTree.some((root) => root.name === draft.menu)) dataSourceEditor.errors.menu = '请选择一级目录 / 大菜单。'
  if (!draft.name) dataSourceEditor.errors.name = '请填写名称，方便业务人员识别。'
  if (!draft.apiUrl) dataSourceEditor.errors.apiUrl = '请填写接口地址。'
  if (!draft.permissionParam) dataSourceEditor.errors.permissionParam = '请填写权限参数。'
  if (draft.remark.length > 120) dataSourceEditor.errors.remark = '备注建议控制在 120 字以内。'
  return !(dataSourceEditor.errors.menu || dataSourceEditor.errors.name || dataSourceEditor.errors.apiUrl || dataSourceEditor.errors.permissionParam || dataSourceEditor.errors.remark)
}

function buildNewDataSourceFromDraft(draft) {
  return { ...emptyDataSourceDraft(), ...draft, group: draft.menu, id: `ds-${Date.now()}` }
}

function saveDataSourceEditor() {
  if (!validateDataSourceEditor()) return
  const draft = { ...dataSourceEditor.draft, group: dataSourceEditor.draft.menu }
  if (dataSourceEditor.mode === 'create') {
    const source = buildNewDataSourceFromDraft(draft)
    syncDataSourcePermissionToTree(source)
    dataSources.unshift(source)
    showDataSourceNotice(`已新增“${source.name}”，并同步生成可授权数据权限。`)
  } else {
    const index = dataSources.findIndex((source) => source.id === dataSourceEditor.sourceId)
    if (index >= 0) {
      const nextSource = { ...dataSources[index], ...draft }
      syncDataSourcePermissionToTree(nextSource)
      dataSources.splice(index, 1, nextSource)
      selectedDataSourceId.value = dataSources[index].id
      showDataSourceNotice(`已保存“${draft.name}”，并同步更新角色可选数据权限。`)
    }
  }
  dataSourceEditor.notice = '保存成功。'
  dataSourceEditor.visible = false
}

function deleteDataSource(row) {
  if (!window.confirm(`确认删除“${row.name}”吗？删除后当前 POC 列表将不再展示该数据源。`)) return
  const index = dataSources.findIndex((source) => source.id === row.id)
  if (index >= 0) {
    removeDataSourcePermission(dataSources[index])
    dataSources.splice(index, 1)
  }
  if (selectedDataSourceId.value === row.id) {
    selectedDataSourceId.value = ''
    dataSourceDetailVisible.value = false
  }
  showDataSourceNotice(`已删除“${row.name}”，并移除对应数据权限。`)
}

function openDataSourceDetail(row) {
  if (!row || row.itemKind !== 'source') return
  selectedDataSourceId.value = row.sourceId || row.id
  dataSourceDetailVisible.value = true
}

function clearDataSourceNoticeTimer() {
  if (!dataSourceNoticeTimer) return
  window.clearTimeout(dataSourceNoticeTimer)
  dataSourceNoticeTimer = null
}

function dismissDataSourceNotice() {
  clearDataSourceNoticeTimer()
  dataSourceNotice.value = ''
}

function showDataSourceNotice(message) {
  clearDataSourceNoticeTimer()
  dataSourceNotice.value = message
  dataSourceNoticeTimer = window.setTimeout(() => {
    dataSourceNotice.value = ''
    dataSourceNoticeTimer = null
  }, 2800)
}

function showsApplicationInfoField(field) {
  return schemaHasField(applicationInfoSchema.value, field)
}

function applicationInfoFieldMap() {
  return {
    targetUser: APPLICATION_INFO_FIELD.targetUser,
    targetItcode: APPLICATION_INFO_FIELD.targetItcode,
    relatedAccount: APPLICATION_INFO_FIELD.relatedAccount,
    accountPassword: APPLICATION_INFO_FIELD.accountPassword,
    confirmAccountPassword: APPLICATION_INFO_FIELD.confirmAccountPassword,
    mobile: APPLICATION_INFO_FIELD.mobile,
    email: APPLICATION_INFO_FIELD.email,
    applicantManager: APPLICATION_INFO_FIELD.applicantManager,
    targetManager: APPLICATION_INFO_FIELD.targetManager,
    businessApprover: APPLICATION_INFO_FIELD.businessApprover,
    reason: APPLICATION_INFO_FIELD.reason
  }
}

function clearHiddenApplicationInfoFields(schema = applicationInfoSchema.value) {
  const clearableFieldMap = {
    targetUser: APPLICATION_INFO_FIELD.targetUser,
    targetItcode: APPLICATION_INFO_FIELD.targetItcode,
    relatedAccount: APPLICATION_INFO_FIELD.relatedAccount,
    accountPassword: APPLICATION_INFO_FIELD.accountPassword,
    confirmAccountPassword: APPLICATION_INFO_FIELD.confirmAccountPassword,
    targetManager: APPLICATION_INFO_FIELD.targetManager,
    businessApprover: APPLICATION_INFO_FIELD.businessApprover
  }
  Object.entries(clearableFieldMap).forEach(([formKey, field]) => {
    if (!schemaHasField(schema, field)) form[formKey] = ''
  })
}

function submittedApplicationInfo() {
  const schema = applicationInfoSchema.value
  return Object.fromEntries(Object.entries(applicationInfoFieldMap()).map(([formKey, field]) => [
    formKey,
    schemaHasField(schema, field) ? form[formKey] : ''
  ]))
}

function selectPersonType(key) {
  form.personType = key
  clearHiddenApplicationInfoFields()
  Object.keys(formErrors).forEach((field) => { formErrors[field] = '' })
}
function seedChangeRequestFromTargetUser() {
  if (form.type !== 'change') return
  const user = findUserByItcodeOrName(form.targetItcode || form.targetUser)
  if (!user) return
  selectedRoleIds.value = [...(user.roleIds || [])]
  copiedFromItcode.value = ''
  copiedRoleIds.value = []
  selectedFunctionPermissionIds.value = sortedUnique(userInheritedFunctionIds(user))
  selectedDataPermissionIds.value = sortedUnique(userInheritedDataIds(user).concat(user.extraDataPermissionIds || []))
  manualDataPermissionIds.value = [...(user.extraDataPermissionIds || [])]
  clearCopiedDataSources()
  form.tenant = normalizeTenantList(user.tenant).length ? normalizeTenantList(user.tenant) : form.tenant
}

function resetPasswordResetErrors() {
  Object.keys(passwordReset.errors).forEach((field) => {
    passwordReset.errors[field] = ''
  })
}

function setPasswordResetMode(mode) {
  passwordReset.mode = mode
  passwordReset.completed = false
  passwordReset.completedAt = ''
  resetPasswordResetErrors()
}

function validatePasswordResetForm() {
  resetPasswordResetErrors()
  if (passwordReset.mode === 'old-password') {
    passwordReset.errors.oldPassword = passwordReset.oldPassword ? '' : '请填写旧密码完成身份校验。'
  } else {
    passwordReset.errors.contact = passwordReset.mobile || passwordReset.email ? '' : '手机号或邮箱至少填写一项，用于接收验证码。'
    passwordReset.errors.verifyCode = passwordReset.verifyCode ? '' : '请填写短信或邮箱验证码。'
  }
  passwordReset.errors.newPassword = passwordReset.newPassword ? '' : '请填写新密码。'
  passwordReset.errors.confirmPassword = passwordReset.confirmPassword ? '' : '请再次确认新密码。'
  if (passwordReset.newPassword && passwordReset.confirmPassword && passwordReset.newPassword !== passwordReset.confirmPassword) {
    passwordReset.errors.confirmPassword = '两次输入的新密码不一致。'
  }
  return !Object.values(passwordReset.errors).some(Boolean)
}

function completePasswordReset() {
  passwordReset.completed = true
  passwordReset.completedAt = '2026-07-24 15:30'
}

function finishPasswordReset() {
  records.value.unshift({
    time: passwordReset.completedAt || '2026-07-24 15:30',
    title: '重置密码已完成',
    detail: `${form.applicant} 已通过${passwordResetModeLabel.value}完成本人密码修改，未进入审批流程。`,
    status: 'POC 记录'
  })
  resetApplyStepProgress()
}
function validateInfoForm() {
  if (isPasswordResetRequest.value) return validatePasswordResetForm()
  const schema = applicationInfoSchema.value
  formErrors.targetItcode = schemaRequiresField(schema, APPLICATION_INFO_FIELD.targetItcode) && !form.targetItcode
    ? '请填写被申请人 ITCode。'
    : ''
  formErrors.targetUser = schemaRequiresField(schema, APPLICATION_INFO_FIELD.targetUser) && !form.targetUser
    ? '请填写被申请人用户名。'
    : ''
  if (isCreateAccountRequest.value && samePrincipal(form.itcode, form.targetUser)) {
    formErrors.targetUser = '创建账号用于为其他外部协作人员开通账号，被申请人不能与申请人相同。'
  }
  formErrors.relatedAccount = schemaRequiresField(schema, APPLICATION_INFO_FIELD.relatedAccount) && !form.relatedAccount
    ? '请填写负责对接的内部员工 ITCode。'
    : ''
  formErrors.accountPassword = schemaRequiresField(schema, APPLICATION_INFO_FIELD.accountPassword) && !form.accountPassword
    ? '请设置初始登录密码。'
    : ''
  formErrors.confirmAccountPassword = schemaRequiresField(schema, APPLICATION_INFO_FIELD.confirmAccountPassword) && !form.confirmAccountPassword
    ? '请再次确认初始登录密码。'
    : ''
  if (schemaRequiresField(schema, APPLICATION_INFO_FIELD.confirmAccountPassword) && form.accountPassword && form.confirmAccountPassword && form.accountPassword !== form.confirmAccountPassword) {
    formErrors.confirmAccountPassword = '两次输入的初始密码不一致。'
  }
  formErrors.targetManager = schemaRequiresField(schema, APPLICATION_INFO_FIELD.targetManager) && !form.targetManager
    ? '请填写被申请人直线经理 ITCode。'
    : ''
  formErrors.businessApprover = schemaRequiresField(schema, APPLICATION_INFO_FIELD.businessApprover) ? businessApproverError(form.businessApprover) : ''
  formErrors.reason = schemaRequiresField(schema, APPLICATION_INFO_FIELD.reason) && !form.reason
    ? '请补充申请原因，说明业务场景和需要使用的权限范围。'
    : ''
  formErrors.tenant = currentStep.value >= 2 && hasPermissionScopeStep.value ? permissionScopeValidation({ tenant: form.tenant }).tenantError : ''
  return !Object.values(formErrors).some(Boolean)
}

function validatePermissionScopeStep() {
  formErrors.tenant = permissionScopeValidation({ tenant: form.tenant }).tenantError
  const conflictMessage = roleConflictMessage(allSelectedRoleConflicts.value)
  applySubmitNotice.value = conflictMessage
  return !formErrors.tenant && !conflictMessage
}

function resetRoleFilters() {
  roleFilters.keyword = ''
  roleFilters.group = ''
  roleFilters.sensitivity = ''
}

function cloneRole(role) {
  const nextRole = JSON.parse(JSON.stringify(role || emptyRoleDraft()))
  nextRole.customDataRules = normalizeCustomDataRules(nextRole.customDataRules)
  return nextRole
}

function resetRoleEditorErrors() {
  Object.keys(roleEditor.errors).forEach((key) => {
    roleEditor.errors[key] = ''
  })
}

function openRoleEditor(mode, role = null) {
  resetRoleEditorErrors()
  roleEditor.visible = true
  roleEditor.mode = mode
  roleEditor.roleId = role?.id || ''
  roleEditor.activeTab = 'basic'
  roleEditor.notice = mode === 'view' ? '当前为只读查看。' : ''
  roleEditor.draft = cloneRole(role || emptyRoleDraft())
  roleEditor.dataTab = roleEditor.draft.customDataRules.length ? 'custom' : 'normal'
}

function closeRoleEditor() {
  roleEditor.visible = false
  roleEditor.notice = ''
}

function switchRoleEditorToEdit() {
  roleEditor.mode = roleEditor.roleId ? 'edit' : 'create'
  roleEditor.dataTab = roleEditor.draft.customDataRules.length ? 'custom' : 'normal'
  roleEditor.notice = ''
}

function validateRoleEditor() {
  resetRoleEditorErrors()
  roleEditor.errors.name = roleEditor.draft.name ? '' : '请输入角色名称，便于申请人识别该角色用途。'
  roleEditor.errors.type = roleEditor.draft.type ? '' : '请选择角色类型：角色管理员或普通角色。'
  roleEditor.errors.group = roleEditor.draft.group ? '' : '请选择角色组，便于列表筛选和业务归口。'
  roleEditor.errors.owner = roleEditor.draft.owner ? '' : '请输入业务负责人，便于后续审批和维护。'
  const customRuleError = validateCustomTableRules(roleEditor.draft.customDataRules)
  roleEditor.errors.dataMode = roleEditor.draft.dataPermissionIds.length && roleEditor.draft.customDataRules.length ? '普通授权和自定义授权只能选择一种，请先删除其中一类数据权限。' : customRuleError
  return !Object.values(roleEditor.errors).some(Boolean)
}

function saveRoleEditor() {
  if (!validateRoleEditor()) {
    roleEditor.activeTab = roleEditor.errors.dataMode ? 'data' : 'basic'
    return
  }
  const nextRole = cloneRole(roleEditor.draft)
  const affectedUsers = roleEditor.mode === 'edit' ? usersConflictedByRoleCandidate(nextRole) : []
  if (affectedUsers.length) {
    const affectedNames = affectedUsers.slice(0, 3).map((user) => user.name || user.loginAccount).join('、')
    const affectedSuffix = affectedUsers.length > 3 ? ' 等 ' + affectedUsers.length + ' 名用户' : ''
    roleEditor.errors.dataMode = '保存后会导致 ' + affectedNames + affectedSuffix + ' 的角色自定义数据权限冲突，请先统一相关角色权限。'
    roleEditor.activeTab = 'data'
    return
  }
  nextRole.updatedAt = '2026-07-14 18:30'
  nextRole.code = nextRole.code || roleCodeFromName(nextRole.name)
  if (roleEditor.mode === 'create') {
    nextRole.id = `role-${Date.now()}`
    allRoles.push(nextRole)
    roleEditor.roleId = nextRole.id
  } else {
    const index = allRoles.findIndex((role) => role.id === roleEditor.roleId)
    if (index >= 0) {
      allRoles.splice(index, 1, nextRole)
    }
  }
  roleEditor.mode = 'view'
  roleEditor.draft = cloneRole(nextRole)
  roleEditor.notice = '已保存角色配置，申请流程中选择该角色会使用最新权限范围。'
}

function roleCodeFromName(name) {
  const text = String(name || 'NEW').trim()
  return text ? text.slice(0, 3).toUpperCase() : 'NEW'
}

function toggleRoleFunctionPermission(id) {
  if (roleEditorReadonly.value) return
  toggleId(roleEditor.draft.functionPermissionIds, id)
  if (!roleEditor.draft.functionPermissionIds.includes(id)) {
    delete roleEditor.draft.functionPermissionNotes[id]
  }
}

function switchRoleDataTab(tab) {
  roleEditor.errors.dataMode = ''
  if (tab === 'normal' && roleCustomDataLocked.value) {
    roleEditor.errors.dataMode = '当前已有自定义授权，需删除自定义授权后才能使用普通授权。'
    return
  }
  if (tab === 'custom' && roleNormalDataLocked.value) {
    roleEditor.errors.dataMode = '当前已有普通授权，需取消普通授权后才能使用自定义授权。'
    return
  }
  roleEditor.dataTab = tab
}

function toggleRoleDataPermission(id) {
  if (roleEditorReadonly.value) return
  if (roleCustomDataLocked.value) {
    roleEditor.errors.dataMode = '当前已有自定义授权，需删除自定义授权后才能使用普通授权。'
    return
  }
  roleEditor.errors.dataMode = ''
  toggleId(roleEditor.draft.dataPermissionIds, id)
  if (!roleEditor.draft.dataPermissionIds.includes(id)) {
    delete roleEditor.draft.dataPermissionNotes[id]
  }
}

function updateRoleCustomDataRules(rules) {
  if (roleEditorReadonly.value || roleNormalDataLocked.value) return
  roleEditor.draft.customDataRules = normalizeCustomDataRules(rules)
  roleEditor.errors.dataMode = ''
}

function sensitivityMeta(value) {
  return sensitivityOptions.find((option) => option.value === value) || sensitivityOptions[0]
}

function sensitivityLabel(value) {
  return sensitivityMeta(value)?.label || value
}

function sensitivityDescription(value) {
  return sensitivityMeta(value)?.desc || '请选择角色敏感性。'
}

function sensitivityRisk(value) {
  return sensitivityMeta(value)?.risk || 'low'
}

function openRoleDeleteConfirm(role) {
  roleDeleteConfirm.visible = true
  roleDeleteConfirm.role = role
}

function closeRoleDeleteConfirm() {
  roleDeleteConfirm.visible = false
  roleDeleteConfirm.role = null
}

function confirmDeleteRole() {
  const role = roleDeleteConfirm.role
  if (!role || roleDeleteBlockReason.value) return
  const index = allRoles.findIndex((item) => item.id === role.id)
  if (index >= 0) {
    allRoles.splice(index, 1)
  }
  closeRoleDeleteConfirm()
}
function resetApplicationPermissionScope() {
  selectedRoleIds.value = []
  copiedRoleIds.value = []
  selectedFunctionPermissionIds.value = []
  selectedDataPermissionIds.value = []
  manualDataPermissionIds.value = []
  copiedFromItcode.value = ''
  clearCopiedDataSources()
  form.tenant = []
  formErrors.tenant = ''
  closeRoleModal()
  closeCopyModal()
  closeDataModal()
}

function selectRequestType(key) {
  form.type = key
  applySubmitNotice.value = ''
  resetApplicationPermissionScope()
  if (key === 'create') {
    form.personType = 'external'
    form.relatedAccount = ''
    form.scopes.account = ['登录工作台']
  } else if (key === 'enable') {
    form.scopes.account = ['启用账号']
  } else if (key === 'disable') {
    form.scopes.account = ['禁用账号']
  } else if (key === 'reset') {
    form.scopes.account = ['重置密码']
    passwordReset.completed = false
    passwordReset.completedAt = ''
    resetPasswordResetErrors()
  } else {
    form.personType = 'internal'
    form.targetUser = ''
    form.targetItcode = ''
    form.mobile = ''
    form.email = ''
    form.relatedAccount = ''
    form.scopes.account = []
  }
  clearHiddenApplicationInfoFields()
  if (key === 'change') seedChangeRequestFromTargetUser()
  Object.keys(formErrors).forEach((field) => { formErrors[field] = '' })
  if (currentStep.value >= applySteps.value.length) {
    currentStep.value = applySteps.value.length - 1
  }
  maxReachableStep.value = Math.min(maxReachableStep.value, applySteps.value.length - 1)
}

function canOpenApplyStep(index) {
  return index <= maxReachableStep.value
}

function goToApplyStep(index) {
  if (!canOpenApplyStep(index)) return
  applySubmitNotice.value = ''
  currentStep.value = index
}

function unlockApplyStep(index) {
  maxReachableStep.value = Math.max(maxReachableStep.value, index)
}

function resetApplyStepProgress() {
  currentStep.value = 0
  maxReachableStep.value = 0
}

function nextStep() {
  applySubmitNotice.value = ''
  if (currentStep.value === 1 && !validateInfoForm()) return
  if (currentStep.value === 1 && form.type === 'change') seedChangeRequestFromTargetUser()
  if (currentStep.value === 2 && hasPermissionScopeStep.value && !validatePermissionScopeStep()) return
  if (isPasswordResetRequest.value && currentStep.value === 1) {
    completePasswordReset()
  }
  const next = Math.min(currentStep.value + 1, applySteps.value.length - 1)
  currentStep.value = next
  unlockApplyStep(next)
}

function prevStep() {
  applySubmitNotice.value = ''
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

function submitApplication() {
  if (isPasswordResetRequest.value) {
    finishPasswordReset()
    return
  }
  if (!validateInfoForm()) {
    currentStep.value = 1
    unlockApplyStep(1)
    return
  }
  if (hasPermissionScopeStep.value && !validatePermissionScopeStep()) {
    currentStep.value = 2
    unlockApplyStep(2)
    return
  }
  const submittedInfo = submittedApplicationInfo()
  const targetItcode = isCreateAccountRequest.value
    ? (parseApproverItcode(submittedInfo.targetUser) || '待补充')
    : (isInternalPerson.value ? (submittedInfo.targetItcode || '待补充') : (parseApproverItcode(submittedInfo.targetUser) || submittedInfo.targetUser || '待补充'))
  const targetName = isExternalPerson.value ? submittedInfo.targetUser : (submittedInfo.targetItcode || submittedInfo.targetUser || '待补充')
  const permissionSnapshot = createPermissionSnapshot()
  if (form.type === 'change' && !permissionSnapshot.changeSummary.length) {
    applySubmitNotice.value = '未检测到权限变更，请返回权限范围调整所属租户、角色或数据权限后再提交。'
    currentStep.value = applySteps.value.length - 1
    unlockApplyStep(currentStep.value)
    return
  }
  const approvalRouteSeed = {
    typeKey: form.type,
    applicantPersonType: form.applicantPersonType,
    personType: isCreateAccountRequest.value ? 'external' : form.personType,
    applicantItcode: form.itcode,
    targetItcode,
    target: targetName,
    relatedAccount: submittedInfo.relatedAccount
  }
  const nodeType = firstApprovalNodeType(approvalRouteSeed)
  const firstApprover = nodeType === 'system-admin'
    ? form.systemApprover
    : (nodeType === 'relation'
      ? submittedInfo.relatedAccount
      : (nodeType === 'target-manager' ? submittedInfo.targetManager : submittedInfo.applicantManager))
  const applicationNo = generateApplicationNo()
  const approvalRow = createApprovalRow({
    id: applicationNo,
    typeKey: form.type,
    type: selectedType.value.label,
    applicant: form.applicant,
    applicantItcode: form.itcode,
    applicantPersonType: form.applicantPersonType,
    applicantEmail: form.itcode + '@lenovo.com',
    target: targetName,
    targetItcode,
    accountName: isCreateAccountRequest.value ? targetItcode : '',
    passwordConfigured: isCreateAccountRequest.value && !!submittedInfo.accountPassword,
    nodeType,
    approverItcode: firstApprover,
    handlers: [firstApprover].filter(Boolean),
    personType: isCreateAccountRequest.value ? 'external' : form.personType,
    relatedAccount: submittedInfo.relatedAccount,
    mobile: submittedInfo.mobile,
    email: submittedInfo.email,
    applicantManager: submittedInfo.applicantManager,
    targetManager: submittedInfo.targetManager,
    businessApprover: form.businessApprover,
    businessInfo: { tenant: [...form.tenant], organizations: [] },
    systemApprover: form.systemApprover,
    reason: form.reason,
    permissionSnapshot,
    time: '2026-07-13 11:45'
  })
  approvalRow.notificationLogs = createApprovalNotificationLogs(approvalRow)
  openApprovalMailMockTabs(approvalRow)
  approvals.value.unshift(approvalRow)
  approvalNotificationModal.rowId = approvalRow.id
  approvalNotificationModal.visible = true
  records.value.unshift({
    time: '2026-07-13 11:45',
    title: `${selectedType.value.label}申请已提交`,
    detail: isAccountStatusRequest.value
      ? `${targetName} 的申请单号已自动生成为 ${applicationNo}，申请进入审批列表。`
      : `${targetName} 已选择 ${scopeSummaryText.value}，申请进入审批列表。`,
    status: 'POC 记录'
  })
  activeModule.value = 'approval'
  resetApplyStepProgress()
}

function openRoleModal() {
  roleModal.visible = true
  roleModal.keyword = ''
  roleModal.selectedIds = [...selectedRoleIds.value]
  roleModal.selectedFunctionIds = [...selectedFunctionPermissionIds.value]
  roleModal.selectedDataIds = [...selectedDataPermissionIds.value]
  const firstRole = allRoles.find((role) => roleModal.selectedIds.includes(role.id)) || filteredRoleOptions.value[0] || allRoles[0]
  if (firstRole) openRoleDetail(firstRole)
  else closeRoleDetail()
}

function closeRoleModal() {
  roleModal.visible = false
  closeRoleDetail()
}

function openRoleDetail(role) {
  roleModal.detailRoleId = role.id
  roleModal.detailKeyword = ''
  roleModal.activePermissionTab = 'function'
}

function syncRoleModalDetailWithResults() {
  window.setTimeout(() => {
    const currentVisible = filteredRoleOptions.value.some((role) => role.id === roleModal.detailRoleId)
    if (currentVisible) return
    const firstRole = filteredRoleOptions.value[0]
    if (firstRole) openRoleDetail(firstRole)
    else closeRoleDetail()
  }, 0)
}

function closeRoleDetail() {
  roleModal.detailRoleId = ''
  roleModal.detailKeyword = ''
  roleModal.activePermissionTab = 'function'
}
function openRoleCardDetail(role, context = 'application') {
  roleCardDetail.visible = true
  roleCardDetail.roleId = role.id
  roleCardDetail.keyword = ''
  roleCardDetail.activePermissionTab = 'function'
  roleCardDetail.context = context
}

function closeRoleCardDetail() {
  roleCardDetail.visible = false
  roleCardDetail.roleId = ''
  roleCardDetail.keyword = ''
  roleCardDetail.activePermissionTab = 'function'
  roleCardDetail.context = 'application'
}
function inspectApplicationRole(roleId) {
  const role = allRoles.find((item) => item.id === roleId)
  if (role) openRoleCardDetail(role)
}
function toggleTempRole(id) {
  if (copiedRoleIds.value.includes(id)) return
  const role = allRoles.find((item) => item.id === id)
  const selected = roleModal.selectedIds.includes(id)
  toggleId(roleModal.selectedIds, id)
  if (!role) return
  if (selected) {
    const remainingRoleFunctionIds = roleFunctionIds([...roleModal.selectedIds, ...copiedRoleIds.value])
    const remainingRoleDataIds = roleDataIds(roleModal.selectedIds)
    roleModal.selectedFunctionIds = roleModal.selectedFunctionIds.filter((functionId) => (
      !role.functionPermissionIds.includes(functionId) || remainingRoleFunctionIds.includes(functionId)
    ))
    roleModal.selectedDataIds = roleModal.selectedDataIds.filter((dataId) => (
      !role.dataPermissionIds.includes(dataId)
      || remainingRoleDataIds.includes(dataId)
      || manualDataPermissionIds.value.includes(dataId)
      || !!copiedDataSourceMap[dataId]
    ))
  } else {
    addUniqueIds(roleModal.selectedFunctionIds, role.functionPermissionIds)
    addUniqueIds(roleModal.selectedDataIds, role.dataPermissionIds)
  }
}

function confirmRoleSelection() {
  if (roleModalCandidateConflicts.value.length) return
  applyRoleSelection(roleModal.selectedIds)
  selectedFunctionPermissionIds.value = resolvePermissionScopeFunctionIds(
    { selectedFunctionPermissionIds: roleModal.selectedFunctionIds },
    roleFunctionIds(roleModal.selectedIds),
    roleFunctionIds(copiedRoleIds.value)
  )
  const selectedRoleDataIds = roleDataIds(roleModal.selectedIds)
  selectedDataPermissionIds.value = selectedDataPermissionIds.value.filter((id) => !selectedRoleDataIds.includes(id) || roleModal.selectedDataIds.includes(id))
  closeRoleModal()
}

function removeRole(id) {
  applyRoleSelection(selectedRoleIds.value.filter((roleId) => roleId !== id))
}

function openCopyModal() {
  if (copiedFromUser.value) return
  copyModal.visible = true
  copyModal.itcode = copiedFromItcode.value || ''
  copyModal.error = ''
}

function closeCopyModal() {
  copyModal.visible = false
}

function confirmCopyPermissions() {
  if (copiedFromUser.value) return
  const itcode = copyModal.itcode.trim()
  if (!itcode) {
    copyModal.error = '请输入要复制的对方 ITCode。'
    return
  }
  const user = copyableUsers.find((item) => item.itcode.toLowerCase() === itcode.toLowerCase())
  if (!user) {
    copyModal.error = '没有找到该 ITCode 的 mock 权限，请检查后再试。'
    return
  }
  const conflicts = detectCustomDataRoleConflicts(roleObjectsForIds([...selectedRoleIds.value, ...user.roleIds]))
  if (conflicts.length) {
    copyModal.error = roleConflictMessage(conflicts)
    return
  }
  copiedFromItcode.value = user.itcode
  copiedRoleIds.value = [...user.roleIds]
  addUniqueIds(selectedFunctionPermissionIds.value, roleFunctionIds(user.roleIds))
  clearCopiedDataSources()
  user.dataPermissions.forEach((item) => {
    copiedDataSourceMap[item.id] = item.source
  })
  addUniqueIds(selectedDataPermissionIds.value, user.dataPermissions.map((item) => item.id))
  closeCopyModal()
}

function openDataModal() {
  dataModal.visible = true
  dataModal.selectedIds = [...selectedDataPermissionIds.value]
}

function closeDataModal() {
  dataModal.visible = false
}

function toggleTempDataPermission(id) {
  if (copiedDataSourceMap[id]) return
  toggleId(dataModal.selectedIds, id)
}

function confirmDataSelection() {
  const copiedIds = Object.keys(copiedDataSourceMap)
  const nextIds = [...new Set([...dataModal.selectedIds, ...copiedIds])]
  const roleIds = roleDataIds([...selectedRoleIds.value, ...copiedRoleIds.value])
  manualDataPermissionIds.value = nextIds.filter((id) => !roleIds.includes(id) && !copiedIds.includes(id))
  selectedDataPermissionIds.value = nextIds
  closeDataModal()
}

function removeDataPermission(id) {
  if (copiedDataSourceMap[id]) return
  selectedDataPermissionIds.value = selectedDataPermissionIds.value.filter((item) => item !== id)
  manualDataPermissionIds.value = manualDataPermissionIds.value.filter((item) => item !== id)
}

function applyRoleSelection(nextIds) {
  const previousRoleDataIds = currentRoleDataIds()
  selectedRoleIds.value = [...nextIds]
  const nextRoleFunctionIds = currentRoleFunctionIds()
  const nextRoleDataIds = currentRoleDataIds()
  const copiedRoleFunctionIds = roleFunctionIds(copiedRoleIds.value)
  const allowedFunctionIds = new Set([...nextRoleFunctionIds, ...copiedRoleFunctionIds])
  selectedFunctionPermissionIds.value = selectedFunctionPermissionIds.value.filter((id) => allowedFunctionIds.has(id))
  addUniqueIds(selectedFunctionPermissionIds.value, copiedRoleFunctionIds)
  selectedDataPermissionIds.value = selectedDataPermissionIds.value.filter((id) => {
    const wasRoleOnly = previousRoleDataIds.includes(id) && !manualDataPermissionIds.value.includes(id) && !copiedDataSourceMap[id]
    return !(wasRoleOnly && !nextRoleDataIds.includes(id))
  })
  addUniqueIds(selectedDataPermissionIds.value, nextRoleDataIds)
}

function permissionPathInTree(tree, id) {
  for (const root of tree) {
    for (const branch of root.children || []) {
      if ((branch.children || []).some((leaf) => leaf.id === id)) {
        return { rootId: root.id, rootName: root.name, branchId: branch.id, branchName: branch.name }
      }
    }
  }
  return null
}

function dataBranchId(id) {
  if (id.startsWith('data.geo.')) return 'dashboard.geoSource'
  if (id.startsWith('data.lead.')) return 'lead.pool'
  if (id === 'data.ops.metric.flow') return 'ops.traffic'
  if (id === 'data.ops.metric.gmv') return 'ops.gmv'
  if (id.startsWith('data.member.') || id.startsWith('data.ops.region.')) return 'dashboard.overview'
  return 'dashboard.overview'
}

function branchMetaById(branchId) {
  for (const root of functionPermissionTree) {
    const branch = (root.children || []).find((item) => item.id === branchId)
    if (branch) return { rootId: root.id, rootName: root.name, branchId: branch.id, branchName: branch.name }
  }
  return { rootId: 'func.other', rootName: '其他能力', branchId: 'func.other.misc', branchName: '未归类权限' }
}

function ensureRolePermissionBranch(map, meta) {
  if (!map.has(meta.rootId)) {
    map.set(meta.rootId, { id: meta.rootId, name: meta.rootName, children: new Map() })
  }
  const root = map.get(meta.rootId)
  if (!root.children.has(meta.branchId)) {
    root.children.set(meta.branchId, { id: meta.branchId, name: meta.branchName, functions: [], dataPermissions: [] })
  }
  return root.children.get(meta.branchId)
}

function permissionEditorTree() {
  const map = new Map()
  functionPermissionTree.forEach((root) => {
    root.children.forEach((branch) => {
      const target = ensureRolePermissionBranch(map, {
        rootId: root.id,
        rootName: root.name,
        branchId: branch.id,
        branchName: branch.name
      })
      target.functions.push(...(branch.children || []).map((leaf) => functionPermissionDetail(leaf.id)).filter(Boolean))
    })
  })
  dataPermissionTree.forEach((group) => {
    group.children.forEach((child) => {
      const target = ensureRolePermissionBranch(map, {
        rootId: group.id,
        rootName: group.name,
        branchId: child.id,
        branchName: child.name
      })
      child.children.forEach((leaf) => {
        target.dataPermissions.push(leaf)
      })
    })
  })
  return [...map.values()].map((root) => ({
    ...root,
    children: [...root.children.values()]
  }))
}
function rolePermissionTree(role) {
  const map = new Map()
  ;(role?.functionPermissionIds || []).forEach((id) => {
    const meta = permissionPathInTree(functionPermissionTree, id) || branchMetaById('func.other.misc')
    ensureRolePermissionBranch(map, meta).functions.push(functionPermissionDetail(id))
  })
  ;(role?.dataPermissionIds || []).forEach((id) => {
    const permission = findDataPermission(id)
    if (!permission) return
    const meta = dataPermissionBranchMeta(id)
    ensureRolePermissionBranch(map, meta).dataPermissions.push(permission)
  })
  return [...map.values()].map((root) => ({
    ...root,
    children: [...root.children.values()]
  }))
}


function rolePermissionTabCount(role, tab) {
  return tab === 'function' ? (role?.functionPermissionIds || []).length : (role?.dataPermissionIds || []).length
}

function rolePermissionBranchItems(branch, tab) {
  return tab === 'function' ? branch.functions : branch.dataPermissions
}

function rolePermissionBranchLabel(branch, tab) {
  const count = rolePermissionBranchItems(branch, tab).length
  return tab === 'function' ? `${count} 项功能` : `${count} 项数据`
}

function rolePermissionGroupLabel(root, tab) {
  const count = root.children.reduce((sum, branch) => sum + rolePermissionBranchItems(branch, tab).length, 0)
  return tab === 'function' ? `${count} 项功能` : `${count} 项数据`
}

function rolePermissionSearchText(permission, rootName, branchName) {
  return [permission?.name, permission?.description, permission?.scope, permission?.id, rootName, branchName].filter(Boolean).join(' ').toLowerCase()
}

function filteredRolePermissionGroups(role, tab, keyword = '') {
  if (tab === 'data') return dataPermissionDirectoriesForIds(role?.dataPermissionIds || [])
  const text = String(keyword || '').trim().toLowerCase()
  return rolePermissionTree(role).map((root) => {
    const children = root.children.map((branch) => {
      const sourceItems = branch.functions
      const items = text ? sourceItems.filter((permission) => rolePermissionSearchText(permission, root.name, branch.name).includes(text)) : sourceItems
      if (!items.length) return null
      return { ...branch, functions: items, dataPermissions: [] }
    }).filter(Boolean)
    if (!children.length) return null
    return { ...root, children }
  }).filter(Boolean)
}


function isRoleModalFunctionSelected(id) {
  return roleModal.selectedFunctionIds.includes(id)
}

function ensureRoleModalDetailRoleSelected() {
  const role = roleModalDetailRole.value
  if (role && !roleModal.selectedIds.includes(role.id)) {
    roleModal.selectedIds.push(role.id)
  }
}

function toggleRoleModalFunctionPermission(id) {
  if (copiedRoleIds.value.includes(roleModal.detailRoleId)) return
  const willSelect = !roleModal.selectedFunctionIds.includes(id)
  toggleId(roleModal.selectedFunctionIds, id)
  if (willSelect) ensureRoleModalDetailRoleSelected()
}

function isRoleModalDataSelected(id) {
  return roleModal.selectedDataIds.includes(id)
}

function toggleRoleModalDataPermission(id) {
  if (copiedRoleIds.value.includes(roleModal.detailRoleId)) return
  const willSelect = !roleModal.selectedDataIds.includes(id)
  toggleId(roleModal.selectedDataIds, id)
  if (willSelect) ensureRoleModalDetailRoleSelected()
}

function isApplicationFunctionSelected(id) {
  return selectedFunctionPermissionIds.value.includes(id)
}

function toggleApplicationRoleFunctionPermission(id) {
  if (selectedFunctionPermissionIds.value.includes(id)) {
    selectedFunctionPermissionIds.value = selectedFunctionPermissionIds.value.filter((item) => item !== id)
  } else {
    addUniqueIds(selectedFunctionPermissionIds.value, [id])
  }
}

function isApplicationDataSelected(id) {
  return selectedDataPermissionIds.value.includes(id)
}

function toggleApplicationRoleDataPermission(id) {
  if (selectedDataPermissionIds.value.includes(id)) {
    removeDataPermission(id)
  } else {
    addUniqueIds(selectedDataPermissionIds.value, [id])
  }
}
function roleCardPermissionCheckboxDisabled() {
  return true
}

function roleCardDataCheckboxDisabled() {
  if (roleCardDetail.context === 'userWorkspace') return userWorkspacePermissionReadonly.value
  if (roleCardDetail.context === 'copied') return true
  if (approvalWorkspace.visible) return !canEditApprovalPermission.value
  return false
}

function isRoleCardFunctionSelected(id) {
  if (roleCardDetail.context !== 'userWorkspace') return isApplicationFunctionSelected(id)
  const role = roleCardDetailRole.value
  if (!role || !userWorkspace.draft || !role.functionPermissionIds.includes(id)) return false
  return userInheritedFunctionIds(userWorkspace.draft).includes(id)
}

function toggleRoleCardFunctionPermission(id) {
  if (roleCardDetail.context !== 'userWorkspace') {
    if (roleCardPermissionCheckboxDisabled()) return
    toggleApplicationRoleFunctionPermission(id)
    return
  }
  return
}

function isRoleCardDataSelected(id) {
  if (roleCardDetail.context !== 'userWorkspace') return isApplicationDataSelected(id)
  const role = roleCardDetailRole.value
  if (!role || !userWorkspace.draft || !role.dataPermissionIds.includes(id)) return false
  return !(userWorkspace.draft.suppressedRoleDataPermissionIds || []).includes(id)
}

function toggleRoleCardDataPermission(id) {
  if (roleCardDetail.context !== 'userWorkspace') {
    if (roleCardDataCheckboxDisabled()) return
    toggleApplicationRoleDataPermission(id)
    return
  }
  if (roleCardDataCheckboxDisabled() || !userWorkspace.draft) return
  const role = roleCardDetailRole.value
  if (!role || !role.dataPermissionIds.includes(id)) return
  if (isRoleCardDataSelected(id)) {
    removeUserRoleDataPermission(role.id, id)
  } else {
    userWorkspace.draft.suppressedRoleDataPermissionIds = (userWorkspace.draft.suppressedRoleDataPermissionIds || []).filter((item) => item !== id)
    userWorkspace.notice = '已恢复该角色带出的数据权限，保存后生效。'
  }
}
const roleFunctionPreviewLimit = 3

function functionPermissionDetail(id) {
  const managed = managedFunctions.find((permission) => permission.id === id)
  if (managed) return managed
  const permission = allFunctionPermissions.find((item) => item.id === id)
  return permission ? { ...permission, description: '' } : { id, name: id, description: '' }
}

function roleFunctionDetails(role) {
  return (role?.functionPermissionIds || []).filter((id) => selectedFunctionPermissionIds.value.includes(id)).map(functionPermissionDetail)
}

function rawRoleFunctionDetails(role) {
  return (role?.functionPermissionIds || []).map(functionPermissionDetail)
}

function roleFunctionPreview(role) {
  return roleFunctionDetails(role).slice(0, roleFunctionPreviewLimit)
}

function roleHiddenFunctionCount(role) {
  return Math.max(roleFunctionDetails(role).length - roleFunctionPreviewLimit, 0)
}

function filteredRoleDetailFunctions(role, keyword = '') {
  const text = keyword.trim().toLowerCase()
  const permissions = rawRoleFunctionDetails(role)
  if (!text) return permissions
  return permissions.filter((permission) => `${permission.name} ${permission.description || ''}`.toLowerCase().includes(text))
}

function roleFunctionPermissions(role) {
  return roleFunctionDetails(role)
}
function roleDataPermissions(role) {
  return role.dataPermissionIds
    .filter((id) => selectedDataPermissionIds.value.includes(id))
    .map((id) => findDataPermission(id))
    .filter(Boolean)
}

function copiedRoleDataPermissions(role) {
  return role.dataPermissionIds
    .filter((id) => copiedDataSourceMap[id] === '角色继承' && selectedDataPermissionIds.value.includes(id))
    .map((id) => findDataPermission(id))
    .filter(Boolean)
}
function resetRoleDataPermissions(roleId) {
  const role = allRoles.find((item) => item.id === roleId)
  if (!role) return
  addUniqueIds(selectedDataPermissionIds.value, role.dataPermissionIds)
}

function resetCopiedRoleDataPermissions(roleId) {
  const role = allRoles.find((item) => item.id === roleId)
  if (!role) return
  const ids = role.dataPermissionIds.filter((id) => copiedDataSourceMap[id] === '角色继承')
  addUniqueIds(selectedDataPermissionIds.value, ids)
}

function permissionName(id) {
  return allFunctionPermissions.find((permission) => permission.id === id)?.name || id
}

function dataPermissionName(id) {
  return findDataPermission(id)?.name || id
}

function sourceClass(source) {
  if (source === '角色继承') return 'role'
  if (source === '用户单独授权') return 'user'
  return 'manual'
}

function roleFunctionIds(roleIds = []) {
  return [...new Set(allRoles
    .filter((role) => roleIds.includes(role.id))
    .flatMap((role) => role.functionPermissionIds))]
}

function currentRoleFunctionIds() {
  return roleFunctionIds(selectedRoleIds.value)
}

function currentRoleDataIds() {
  return roleDataIds(selectedRoleIds.value)
}

function roleDataIds(roleIds = []) {
  return [...new Set(allRoles
    .filter((role) => roleIds.includes(role.id))
    .flatMap((role) => role.dataPermissionIds))]
}

function addUniqueIds(target, ids) {
  ids.forEach((id) => {
    if (!target.includes(id)) target.push(id)
  })
}

function toggleId(target, id) {
  const index = target.indexOf(id)
  if (index >= 0) {
    target.splice(index, 1)
  } else {
    target.push(id)
  }
}

function clearCopiedDataSources() {
  Object.keys(copiedDataSourceMap).forEach((key) => {
    delete copiedDataSourceMap[key]
  })
}

function findDataPermission(id) {
  for (const group of dataPermissionTree) {
    for (const child of group.children) {
      const leaf = child.children.find((item) => item.id === id)
      if (leaf) return leaf
    }
  }
  return null
}

function dataPermissionDirectoriesForIds(permissionIds = null) {
  const allowedIds = permissionIds ? new Set(permissionIds) : null
  const permissions = dataPermissionTree.flatMap((group) => group.children.flatMap((child) => child.children
    .filter((permission) => !allowedIds || allowedIds.has(permission.id))
    .map((permission) => ({
      ...permission,
      group: group.name,
      page: child.name,
      description: permission.description || ''
    }))))
  return groupDataPermissionsByDirectory(permissions)
}

const dataPermissionDirectories = computed(() => dataPermissionDirectoriesForIds())


function buildSelectedDataTree() {
  const selectedIds = selectedDataPermissionIds.value
  return dataPermissionTree
    .map((group) => {
      const children = group.children
        .map((child) => {
          const leaves = child.children
            .filter((leaf) => selectedIds.includes(leaf.id))
            .map((leaf) => ({
              ...leaf,
              source: copiedDataSourceMap[leaf.id] || (manualDataPermissionIds.value.includes(leaf.id) ? '本次新增' : '')
            }))
          return leaves.length ? { ...child, children: leaves } : null
        })
        .filter(Boolean)
      return children.length ? { ...group, children } : null
    })
    .filter(Boolean)
}

function createPermissionSnapshot(context = {}) {
  const targetItcode = context.targetItcode || form.targetItcode || form.targetUser
  const tenant = context.tenant ?? form.tenant
  const baseline = context.baseline || userPermissionBaselineByItcode(targetItcode)
  const baseSnapshot = currentPermissionSnapshotBase()
  return {
    ...baseSnapshot,
    ...(context.legacyBusinessApproval || (!hasPermissionScopeStep.value && !Object.hasOwn(context, 'businessApprover')) ? {} : { businessApprover: context.businessApprover ?? form.businessApprover }),
    changeSummary: buildPermissionChangeSummary(baseSnapshot, { targetItcode, tenant, baseline }),
    baseline,
    tenant
  }
}

function applyPermissionSnapshotToEditor(snapshot = {}) {
  selectedRoleIds.value = [...(snapshot.selectedRoleIds || [])]
  copiedFromItcode.value = snapshot.copiedFromItcode || ''
  copiedRoleIds.value = [...(snapshot.copiedRoleIds || [])]
  const selectedAndCopiedRoleFunctionIds = roleFunctionIds([...(snapshot.selectedRoleIds || []), ...(snapshot.copiedRoleIds || [])])
  selectedFunctionPermissionIds.value = resolvePermissionScopeFunctionIds(
    snapshot,
    selectedAndCopiedRoleFunctionIds,
    roleFunctionIds(snapshot.copiedRoleIds || [])
  )
  selectedDataPermissionIds.value = [...(snapshot.selectedDataPermissionIds || [])]
  manualDataPermissionIds.value = [...(snapshot.manualDataPermissionIds || [])]
  clearCopiedDataSources()
  Object.entries(snapshot.copiedDataSourceMap || {}).forEach(([key, value]) => {
    copiedDataSourceMap[key] = value
  })
}

function roleNamesForIds(roleIds = []) {
  return allRoles
    .filter((role) => roleIds.includes(role.id))
    .map((role) => role.name)
}

function roleGroupsForIds(roleIds = []) {
  return [...new Set(allRoles
    .filter((role) => roleIds.includes(role.id))
    .map((role) => role.group)
    .filter(Boolean))]
}

function selectedApprovalRoleIds(snapshot = {}) {
  return [...new Set([...(snapshot.selectedRoleIds || []), ...(snapshot.copiedRoleIds || [])])]
}

function createBusinessApprovalTasks(permissionSnapshot = {}, existingTasks = []) {
  if (Object.hasOwn(permissionSnapshot, 'businessApprover')) {
    return createSelectedBusinessApprovalTasks(permissionSnapshot, allRoles, existingTasks)
  }
  // 仅兼容旧申请；新申请始终使用提交时选定的业务负责人。
  const roleIds = selectedApprovalRoleIds(permissionSnapshot)
  const taskMap = new Map()
  roleIds.forEach((roleId) => {
    const role = allRoles.find((item) => item.id === roleId)
    const approver = parseApproverItcode(role?.owner || '')
    if (!role || !approver) return
    if (!taskMap.has(approver)) {
      const existing = existingTasks.find((task) => samePrincipal(task.approver, approver)) || {}
      taskMap.set(approver, {
        approver,
        approverName: existing.approverName || approver,
        roleIds: [],
        roleNames: [],
        organizations: [...(existing.organizations || [])],
        status: existing.status || 'pending',
        result: existing.result || '',
        opinion: existing.opinion || '',
        handledAt: existing.handledAt || ''
      })
    }
    const task = taskMap.get(approver)
    task.roleIds.push(role.id)
    task.roleNames.push(role.name)
  })
  return [...taskMap.values()].map((task) => ({
    ...task,
    roleIds: [...new Set(task.roleIds)],
    roleNames: [...new Set(task.roleNames)]
  }))
}

function resetBusinessApprovalTasks(row) {
  row.businessApprovalTasks = createBusinessApprovalTasks(row.permissionSnapshot).map((task) => ({
    ...task,
    organizations: [],
    status: 'pending',
    result: '',
    opinion: '',
    handledAt: ''
  }))
  syncBusinessApprovalHandlers(row)
}

function pendingBusinessTasks(row) {
  return (row?.businessApprovalTasks || []).filter((task) => task.status === 'pending')
}

function pendingBusinessApprovers(row) {
  return pendingBusinessTasks(row).map((task) => task.approver)
}

function businessTaskStatusLabel(task) {
  if (task.status === 'approved') return '已通过'
  if (task.status === 'rejected') return '已驳回'
  return '待审批'
}

function businessOrganizationsUnion(row) {
  return [...new Set((row?.businessApprovalTasks || [])
    .filter((task) => task.status === 'approved')
    .flatMap((task) => task.organizations || []))]
}

function syncBusinessApprovalHandlers(row) {
  const pending = pendingBusinessApprovers(row)
  if (!pending.length) return
  row.nodeType = 'business'
  row.node = pending.length > 1 ? '业务负责人审批（' + pending.length + '人待审）' : '业务负责人审批'
  row.approverItcode = pending[0]
  row.handlers = pending
  row.status = '待我审批'
  row.statusKey = 'pending'
}

function enterBusinessApprovalNode(row) {
  resetBusinessApprovalTasks(row)
  if (!row.businessApprovalTasks.length) {
    completeApprovalExecution(row, '2026-07-13 16:30')
    return
  }
  syncBusinessApprovalHandlers(row)
  row.notificationLogs = createApprovalNotificationLogs(row)
  row.time = '2026-07-13 16:30'
}

function applyApprovedUserPermissionChange(row, time) {
  if (row.source !== 'user-management' || row.typeKey !== 'change' || row.userManagementApplied || !row.proposedUserPermission) return
  const user = users.find((item) => item.userAccount === row.targetUserAccount)
  if (!user) return
  const permissionState = userPermissionState(row.proposedUserPermission)
  user.tenant = permissionState.tenant
  user.roleIds = permissionState.roleIds
  user.selectedRoleFunctionPermissionIds = permissionState.selectedRoleFunctionPermissionIds
  user.extraDataPermissionIds = permissionState.extraDataPermissionIds
  user.suppressedRoleDataPermissionIds = permissionState.suppressedRoleDataPermissionIds
  user.customDataRules = permissionState.customDataRules
  appendUserChange(user, '权限变更生效', row.id, '审批已完成，新的租户、角色、功能权限和数据权限已生效。', time)
  row.userManagementApplied = true
}

function completeApprovalExecution(row, time = '2026-07-13 16:30') {
  if (Object.hasOwn(row.permissionSnapshot || {}, 'businessApprover') && (businessApproverError(row.permissionSnapshot.businessApprover) || row.businessApprovalTasks?.length !== 1 || row.businessApprovalTasks[0].approver !== row.permissionSnapshot.businessApprover || row.businessApprovalTasks[0].status !== 'approved')) {
    updateApprovalNode(row, 'rework', { status: '已驳回', statusKey: 'rejected', approverItcode: row.applicantItcode, handlers: [row.applicantItcode] })
    row.approvalLogs.push({ node: '业务审批校验', action: 'reject', operator: 'system', opinion: '指定的业务负责人缺失、无效或尚未审批通过，请重新确认申请。', time })
    return
  }
  row.businessInfo.organizations = businessOrganizationsUnion(row)
  updateApprovalNode(row, 'done', {
    status: '已完成',
    statusKey: 'done',
    approverItcode: 'system',
    handlers: [...new Set(row.handlers || [])]
  })
  applyApprovedUserPermissionChange(row, time)
  row.approvalLogs.push({
    node: '系统执行结果',
    action: 'execute-success',
    operator: 'system',
    opinion: '全部必要审批已通过，系统已一次性执行权限变更，执行结果：成功。',
    time
  })
}

function createApprovalRow(payload) {
  const normalizedNodeType = payload.nodeType || firstApprovalNodeType(payload)
  const nodeMeta = approvalNodeMeta(normalizedNodeType)
  const permissionSnapshot = payload.permissionSnapshot || emptyPermissionSnapshot()
  return {
    id: payload.id,
    source: payload.source || '',
    targetUserAccount: payload.targetUserAccount || '',
    proposedUserPermission: payload.proposedUserPermission ? userPermissionState(payload.proposedUserPermission) : null,
    userManagementApplied: !!payload.userManagementApplied,
    typeKey: payload.typeKey || 'change',
    type: payload.type || '权限变更',
    applicant: payload.applicant || 'admin',
    applicantItcode: payload.applicantItcode || payload.applicant || 'admin',
    applicantPersonType: payload.applicantPersonType || 'internal',
    applicantEmail: payload.applicantEmail || ((payload.applicantItcode || payload.applicant || 'admin') + '@lenovo.com'),
    target: payload.target || '待补充',
    targetItcode: payload.targetItcode || parseApproverItcode(payload.target) || '待补充',
    accountName: payload.accountName || payload.targetItcode || parseApproverItcode(payload.target) || '',
    passwordConfigured: !!payload.passwordConfigured,
    personType: payload.personType || 'internal',
    relatedAccount: payload.relatedAccount ?? '',
    mobile: payload.mobile ?? '13800000000',
    email: payload.email ?? `${payload.target || 'user'}@lenovo.com`,
    applicantManager: payload.applicantManager ?? payload.manager ?? 'sunll1',
    targetManager: payload.targetManager ?? payload.manager ?? 'wangxt8',
    manager: payload.applicantManager ?? payload.manager ?? 'sunll1',
    businessApprover: Object.hasOwn(permissionSnapshot, 'businessApprover') ? permissionSnapshot.businessApprover : (payload.businessApprover || ''),
    systemApprover: payload.systemApprover || 'sunzh4',
    reason: payload.reason || '需要根据业务职责开通或调整乐享 AI 工作台权限。',
    sourceApplicationNo: payload.sourceApplicationNo || '',
    nodeType: normalizedNodeType,
    node: payload.node || nodeMeta.label,
    approverItcode: payload.approverItcode || nodeMeta.owner || 'sunll1',
    handlers: payload.handlers?.length ? [...payload.handlers] : [payload.approverItcode || nodeMeta.owner || 'sunll1'],
    status: payload.status || nodeMeta.status,
    statusKey: payload.statusKey || nodeMeta.statusKey,
    time: payload.time || '2026-07-13 11:45',
    businessInfo: {
      organizations: [...(payload.businessInfo?.organizations || [])],
      tenant: normalizeTenantList(payload.businessInfo?.tenant || payload.tenant || payload.permissionSnapshot?.tenant)
    },
    permissionSnapshot: {
      ...(Object.hasOwn(permissionSnapshot, 'businessApprover') ? { businessApprover: permissionSnapshot.businessApprover } : {}),
      selectedRoleIds: [...(permissionSnapshot.selectedRoleIds || [])],
      copiedFromItcode: permissionSnapshot.copiedFromItcode || '',
      copiedRoleIds: [...(permissionSnapshot.copiedRoleIds || [])],
      selectedFunctionPermissionIds: resolvePermissionScopeFunctionIds(
        permissionSnapshot,
        roleFunctionIds([...(permissionSnapshot.selectedRoleIds || []), ...(permissionSnapshot.copiedRoleIds || [])]),
        roleFunctionIds(permissionSnapshot.copiedRoleIds || [])
      ),
      selectedDataPermissionIds: [...(permissionSnapshot.selectedDataPermissionIds || [])],
      manualDataPermissionIds: [...(permissionSnapshot.manualDataPermissionIds || [])],
      copiedDataSourceMap: { ...(permissionSnapshot.copiedDataSourceMap || {}) },
      changeSummary: permissionSnapshot.changeSummary ? [...permissionSnapshot.changeSummary] : buildPermissionChangeSummary(permissionSnapshot, { targetItcode: payload.targetItcode || payload.target, tenant: payload.businessInfo?.tenant || payload.tenant || permissionSnapshot.tenant, baseline: permissionSnapshot.baseline }),
      baseline: permissionSnapshot.baseline || userPermissionBaselineByItcode(payload.targetItcode || payload.target),
      tenant: normalizeTenantList(payload.businessInfo?.tenant || payload.tenant || permissionSnapshot.tenant)
    },
    businessApprovalTasks: (Object.hasOwn(permissionSnapshot, 'businessApprover')
      ? createBusinessApprovalTasks(permissionSnapshot, payload.businessApprovalTasks || [])
      : (payload.businessApprovalTasks?.length ? payload.businessApprovalTasks : createBusinessApprovalTasks(permissionSnapshot))).map((task) => ({
      approver: parseApproverItcode(task.approver),
      approverName: task.approverName || parseApproverItcode(task.approver),
      roleIds: [...(task.roleIds || [])],
      roleNames: task.roleNames?.length ? [...task.roleNames] : roleNamesForIds(task.roleIds || []),
      organizations: [...(task.organizations || [])],
      status: task.status || 'pending',
      result: task.result || '',
      opinion: task.opinion || '',
      handledAt: task.handledAt || ''
    })),
    approvalLogs: [...(payload.approvalLogs || [])],
    notificationLogs: [...(payload.notificationLogs || [])]
  }
}

function emptyPermissionSnapshot() {
  return {
    selectedRoleIds: [],
    copiedFromItcode: '',
    copiedRoleIds: [],
    selectedFunctionPermissionIds: [],
    selectedDataPermissionIds: [],
    manualDataPermissionIds: [],
    copiedDataSourceMap: {}
  }
}

function approvalNodeMeta(nodeType) {
  const map = {
    relation: { label: '关联人审批', owner: 'wangxt8', status: '待我审批', statusKey: 'pending' },
    'applicant-manager': { label: '申请人直线经理审批', owner: 'sunll1', status: '待我审批', statusKey: 'pending' },
    'target-manager': { label: '被申请人直线经理审批', owner: 'wangxt8', status: '待我审批', statusKey: 'pending' },
    business: { label: '业务负责人审批', owner: 'zhangjq4', status: '待我审批', statusKey: 'pending' },
    'system-admin': { label: '系统管理员审批', owner: 'sunzh4', status: '待我审批', statusKey: 'pending' },
    execute: { label: '系统执行结果', owner: 'system', status: '已完成', statusKey: 'done' },
    done: { label: '执行完成', owner: 'system', status: '已完成', statusKey: 'done' },
    rework: { label: '申请人修改', owner: '申请人', status: '已驳回', statusKey: 'rejected' }
  }
  return map[nodeType] || map['target-manager']
}

function normalizePrincipal(value) {
  return parseApproverItcode(value).toLowerCase()
}

function samePrincipal(left, right) {
  return !!normalizePrincipal(left) && normalizePrincipal(left) === normalizePrincipal(right)
}

function isSameApplicantAndTarget(row) {
  return samePrincipal(row.applicantItcode, row.targetItcode || row.target)
}

function approvalRouteNodeTypes(row) {
  if (isSystemAdminOnlyRequest(row)) return ['system-admin']
  const nodes = []
  const applicantIsExternal = row?.applicantPersonType === 'external'
  const targetIsExternal = row?.personType === 'external' || row?.typeKey === 'create'
  if (applicantIsExternal) {
    nodes.push('relation')
  } else {
    if (targetIsExternal && !samePrincipal(row?.relatedAccount, row?.applicantItcode || row?.applicant)) {
      nodes.push('relation')
    }
    nodes.push('applicant-manager')
    if (!targetIsExternal && !isSameApplicantAndTarget(row)) {
      nodes.push('target-manager')
    }
  }
  nodes.push('business', 'done')
  return nodes
}

function buildDemoApprovalRouteSteps(row) {
  if (!row) return []
  const route = approvalRouteNodeTypes(row)
  const steps = [{ key: 'submit', label: '提交申请', nodeTypes: ['submit'] }]
  const labels = {
    relation: '关联人确认',
    'applicant-manager': '申请人直线经理审批',
    'target-manager': '被申请人直线经理审批',
    business: '业务负责人审批',
    'system-admin': '系统管理员审批',
    done: '权限执行'
  }
  route.forEach((nodeType) => {
    steps.push({ key: nodeType, label: labels[nodeType] || approvalNodeMeta(nodeType).label, nodeTypes: [nodeType] })
  })
  const matchedIndex = steps.findIndex((step) => step.nodeTypes.includes(row.nodeType))
  const currentIndex = matchedIndex >= 0 ? matchedIndex : Math.min(1, steps.length - 1)
  return steps.map((step, index) => ({
    ...step,
    state: index < currentIndex ? 'complete' : (index === currentIndex ? 'current' : 'pending'),
    description: index === 0
      ? `${row.type} · 进行中`
      : (index < currentIndex ? '已完成' : (index === currentIndex ? '进行中' : '待流转'))
  }))
}

function toggleDemoRouteFold(direction) {
  if (direction === 'before') {
    demoRouteBeforeExpanded.value = !demoRouteBeforeExpanded.value
    return
  }
  demoRouteAfterExpanded.value = !demoRouteAfterExpanded.value
}

function openCurrentDemoApprovalDetail() {
  if (!currentDemoApproval.value) return
  activeModule.value = 'approval'
  openApprovalWorkspace(currentDemoApproval.value, 'view')
}

function firstApprovalNodeType(row) {
  return approvalRouteNodeTypes(row)[0] || 'done'
}

function rowNeedsTargetManager(row) {
  return approvalRouteNodeTypes(row).includes('target-manager')
}

function parseApproverItcode(value) {
  return String(value || '').split('（')[0].trim()
}

function isApprovalHandlerSelected(handler) {
  return approvalSearch.handlers.some((item) => item.toLowerCase() === String(handler).toLowerCase())
}

function addApprovalHandler() {
  const draft = approvalSearch.handlerDraft.trim()
  const handler = handlerSuggestions.value[0] || draft
  if (!handler) return
  selectApprovalHandler(handler)
}

function selectApprovalHandler(handler) {
  const normalized = String(handler).trim()
  if (!normalized) return
  if (!isApprovalHandlerSelected(normalized)) {
    approvalSearch.handlers.push(normalized)
  }
  approvalSearch.handlerDraft = ''
  approvalSearch.handlerFocused = true
}

function removeApprovalHandler(handler) {
  approvalSearch.handlers = approvalSearch.handlers.filter((item) => item !== handler)
}

function deferCloseHandlerSuggestions() {
  window.setTimeout(() => {
    approvalSearch.handlerFocused = false
  }, 120)
}
function resetApprovalFilters() {
  approvalSearch.status = '全部'
  approvalSearch.approverItcode = ''
  approvalSearch.viewer = 'approver'
  approvalSearch.handlerDraft = ''
  approvalSearch.handlerFocused = false
  approvalSearch.handlers = []
  approvalMailRoleContext.value = ''
  approvalDeepLinkTicket.value = ''
}

function openApprovalWorkspace(row, mode) {
  applyPermissionSnapshotToEditor(row.permissionSnapshot)
  approvalWorkspace.visible = true
  approvalWorkspace.mode = mode
  approvalWorkspace.rowId = row.id
  approvalWorkspace.nodeType = row.nodeType
  approvalWorkspace.title = mode === 'view' ? '申请详情' : approvalDecisionTitleByNode(row.nodeType)
  approvalWorkspace.result = ''
  approvalWorkspace.opinion = ''
  const activeBusinessTask = pendingBusinessTasks(row).find((task) => samePrincipal(task.approver, approvalSearch.approverItcode)) || pendingBusinessTasks(row)[0] || null
  approvalWorkspace.businessApprover = activeBusinessTask?.approver || row.approverItcode
  approvalWorkspace.organizations = [...(activeBusinessTask?.organizations || [])]
  approvalWorkspace.tenant = normalizeTenantList(row.businessInfo?.tenant)
  approvalWorkspace.notice = mode === 'view' ? '当前为只读详情。' : ''
  clearApprovalErrors()
}

function approvalDecisionTitleByNode(nodeType) {
  if (nodeType === 'relation') return '关联确认'
  if (nodeType === 'applicant-manager') return '申请人直线经理审批'
  if (nodeType === 'target-manager') return '被申请人直线经理审批'
  if (nodeType === 'business') return '业务负责人审批'
  if (nodeType === 'system-admin') return '系统管理员审批'
  return '审批处理'
}

function closeApprovalWorkspace() {
  approvalWorkspace.visible = false
}

function clearApprovalErrors() {
  approvalWorkspace.errors.result = ''
  approvalWorkspace.errors.organizations = ''
  approvalWorkspace.errors.tenant = ''
}

function selectApprovalResult(value) {
  approvalWorkspace.result = value
  approvalWorkspace.errors.result = ''
}

function toggleApprovalOrganization(org) {
  if (!canEditBusinessOwnership.value) return
  toggleId(approvalWorkspace.organizations, org)
  approvalWorkspace.errors.organizations = ''
}

function validateApprovalDecision() {
  clearApprovalErrors()
  if (!approvalWorkspace.result) {
    approvalWorkspace.errors.result = '请选择审批结果，例如同意或驳回。'
  }
  if (approvalWorkspace.result === 'agree' && Object.hasOwn(activeApproval.value?.permissionSnapshot || {}, 'businessApprover') && businessApproverError(activeApproval.value.permissionSnapshot.businessApprover)) {
    approvalWorkspace.errors.result = '业务负责人无效，请驳回申请后重新选择。'
  }
  if (canEditBusinessOwnership.value && approvalWorkspace.result === 'agree') {
    approvalWorkspace.errors.organizations = approvalWorkspace.organizations.length ? '' : '请选择至少一个所属组织，便于后台按组织授权。'
  }

  return !Object.values(approvalWorkspace.errors).some(Boolean)
}

function submitApprovalDecision() {
  if (!activeApproval.value || !validateApprovalDecision()) return
  if (approvalWorkspace.result === 'agree' && canEditApprovalPermission.value && allSelectedRoleConflicts.value.length) {
    approvalWorkspace.notice = roleConflictMessage(allSelectedRoleConflicts.value)
    return
  }
  const row = activeApproval.value
  if (canEditApprovalPermission.value) {
    row.permissionSnapshot = createPermissionSnapshot({
      targetItcode: row.targetItcode || row.target,
      tenant: normalizeTenantList(row.businessInfo?.tenant || row.permissionSnapshot?.tenant),
      baseline: row.permissionSnapshot?.baseline,
      businessApprover: row.permissionSnapshot?.businessApprover,
      legacyBusinessApproval: !Object.hasOwn(row.permissionSnapshot || {}, 'businessApprover')
    })
  }
  if (canEditBusinessOwnership.value) {
    const task = pendingBusinessTasks(row).find((item) => samePrincipal(item.approver, approvalWorkspace.businessApprover)) || pendingBusinessTasks(row)[0]
    if (task) {
      task.organizations = [...approvalWorkspace.organizations]
      task.status = approvalWorkspace.result === 'agree' ? 'approved' : 'rejected'
      task.result = approvalWorkspace.result
      task.opinion = approvalWorkspace.opinion || '无补充意见'
      task.handledAt = '2026-07-13 16:30'
    }
    row.businessInfo.organizations = businessOrganizationsUnion(row)
  }

  row.approvalLogs.push({
    node: row.node,
    action: approvalWorkspace.result,
    operator: canEditBusinessOwnership.value ? (approvalWorkspace.businessApprover || row.approverItcode) : row.approverItcode,
    opinion: approvalWorkspace.opinion || '无补充意见',
    time: '2026-07-13 16:30'
  })
  if (approvalWorkspace.result === 'reject') {
    updateApprovalNode(row, 'rework', {
      status: '已驳回',
      statusKey: 'rejected',
      approverItcode: row.applicantItcode,
      handlers: [row.applicantItcode]
    })
  } else if (approvalWorkspace.nodeType === 'relation') {
    if (row.applicantPersonType === 'external') {
      enterBusinessApprovalNode(row)
    } else {
      updateApprovalNode(row, 'applicant-manager', {
        approverItcode: row.applicantManager,
        handlers: [row.applicantManager]
      })
    }
  } else if (approvalWorkspace.nodeType === 'applicant-manager') {
    if (rowNeedsTargetManager(row)) {
      updateApprovalNode(row, 'target-manager', {
        approverItcode: row.targetManager,
        handlers: [row.targetManager]
      })
    } else {
      enterBusinessApprovalNode(row)
    }
  } else if (approvalWorkspace.nodeType === 'target-manager') {
    enterBusinessApprovalNode(row)
  } else if (approvalWorkspace.nodeType === 'business' && pendingBusinessTasks(row).length) {
    syncBusinessApprovalHandlers(row)
  } else if (approvalWorkspace.nodeType === 'business') {
    completeApprovalExecution(row, '2026-07-13 16:30')
  } else if (approvalWorkspace.nodeType === 'system-admin') {
    completeApprovalExecution(row, '2026-07-13 16:30')
  } else {
    completeApprovalExecution(row, '2026-07-13 16:30')
  }
  records.value.unshift({
    time: row.time,
    title: `${row.id} ${approvalDecisionTitleByNode(approvalWorkspace.nodeType)}已提交`,
    detail: `${row.target} 的审批结果为“${approvalResultLabel(approvalWorkspace.result)}”，当前流转到“${row.node}”。${row.statusKey === 'done' ? ' 系统已执行权限变更，执行结果：成功。' : ''}`,
    status: 'POC 记录'
  })
  approvalWorkspace.notice = '已提交审批，列表状态已更新。'
  closeApprovalWorkspace()
}

function updateApprovalNode(row, nodeType, overrides = {}) {
  const meta = approvalNodeMeta(nodeType)
  row.nodeType = nodeType
  row.node = overrides.node || meta.label
  row.status = overrides.status || meta.status
  row.statusKey = overrides.statusKey || meta.statusKey
  row.approverItcode = overrides.approverItcode || meta.owner
  row.handlers = overrides.handlers || [row.approverItcode]
  row.time = '2026-07-13 16:30'
}

function normalizeApprovalMailRole(value) {
  const role = String(value || '').trim().split(':')[0]
  const aliasMap = {
    requester: 'applicant',
    applicant: 'applicant',
    target: 'target',
    relation: 'relation',
    approver: 'approver',
    'applicant-manager': 'applicant-manager',
    'target-manager': 'target-manager',
    'business-owner': 'business-owner',
    business: 'business-owner',
    'system-admin': 'system-admin',
    system: 'system-admin'
  }
  return aliasMap[role] || ''
}

function demoIdentityKeyForMailRole(role) {
  const normalized = normalizeApprovalMailRole(role)
  const map = {
    applicant: 'requester',
    target: 'requester',
    relation: 'relation',
    'applicant-manager': 'applicant-manager',
    'target-manager': 'target-manager',
    'business-owner': 'business-owner',
    'system-admin': 'system-admin'
  }
  return map[normalized] || 'admin'
}

function applyApprovalMailContext(role, ticket = '') {
  const rawRole = String(role || '').trim()
  const normalizedRole = normalizeApprovalMailRole(rawRole)
  if (!normalizedRole) return false
  const identityKey = demoIdentityKeyForMailRole(normalizedRole)
  const identity = demoIdentityOptions.find((item) => item.key === identityKey) || demoIdentityOptions[0]
  const row = approvals.value.find((item) => item.id === ticket) || {}
  const readonlyViewer = ['applicant', 'target'].includes(normalizedRole)
  demoIdentityKey.value = identity.key
  approvalMailRoleContext.value = rawRole || normalizedRole
  approvalDeepLinkTicket.value = ticket
  approvalSearch.viewer = readonlyViewer ? normalizedRole : identity.viewer
  approvalSearch.approverItcode = readonlyViewer ? '' : (ticket ? approverItcodeForMailRole(row, rawRole || normalizedRole) : identity.approverItcode)
  approvalSearch.status = identity.key === 'requester' ? '全部' : '审批中'
  return true
}

function approvalRowVisibleInMailContext(row) {
  const role = normalizeApprovalMailRole(approvalMailRoleContext.value)
  const rawRole = approvalMailRoleContext.value
  const ticket = approvalDeepLinkTicket.value
  if (ticket && row.id !== ticket) return false
  if (!role) return true
  if (role === 'applicant') return samePrincipal(row.applicantItcode, approverItcodeForMailRole(row, role)) || !!ticket
  if (role === 'target') return samePrincipal(row.targetItcode, approverItcodeForMailRole(row, role)) || !!ticket
  if (role === 'relation') return samePrincipal(row.relatedAccount, approverItcodeForMailRole(row, role)) || row.nodeType === 'relation'
  if (role === 'applicant-manager') return samePrincipal(row.applicantManager, approverItcodeForMailRole(row, role))
  if (role === 'target-manager') return samePrincipal(row.targetManager, approverItcodeForMailRole(row, role))
  if (role === 'business-owner') return (row.businessApprovalTasks || []).some((task) => samePrincipal(task.approver, approverItcodeForMailRole(row, rawRole))) || samePrincipal(row.businessApprover, approverItcodeForMailRole(row, rawRole))
  if (role === 'system-admin') return samePrincipal(row.systemApprover, approverItcodeForMailRole(row, role))
  return true
}

function approvalDisplayStatus(row) {
  if (!row) return ''
  if (row.statusKey === 'done') return '已完成'
  if (row.statusKey === 'rejected') return '已驳回'
  return '审批中'
}

function approvalDisplayStatusKey(row) {
  if (row?.statusKey === 'done') return 'done'
  if (row?.statusKey === 'rejected') return 'rejected'
  return 'pending'
}

function canApproveRow(row) {
  const identity = currentDemoIdentity.value
  const approver = approvalSearch.approverItcode.trim()
  const nodeAllowed = identity.key === 'admin' || identity.nodeTypes.includes(row?.nodeType)
  const approverMatched = identity.key === 'admin' || (!!approver && (samePrincipal(row.approverItcode, approver) || (row.handlers || []).some((handler) => samePrincipal(handler, approver))))
  return row?.statusKey === 'pending' && !approvalReadonlyViewer.value && nodeAllowed && approverMatched
}

function approvalPersonMail(itcode, fallback = 'user') {
  const normalized = parseApproverItcode(itcode) || fallback
  return `${normalized}@lenovo.com`
}

function approvalAppBaseUrl(path = '/agent/permissions') {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const fullPath = `${base}${path}`
  if (typeof window === 'undefined') return fullPath
  return `${window.location.origin}${fullPath}`
}

function approvalListLink(row, action = '', viewer = 'approver', role = '') {
  const query = [
    `module=approval`,
    `ticket=${encodeURIComponent(row.id)}`,
    `approver=${encodeURIComponent(approverItcodeForMailRole(row, role) || row.approverItcode)}`,
    `viewer=${encodeURIComponent(viewer)}`
  ]
  if (role) query.push(`identity=${encodeURIComponent(role)}`)
  if (action) query.push(`action=${encodeURIComponent(action)}`)
  return `${approvalAppBaseUrl('/agent/permissions')}?${query.join('&')}`
}

function approvalActionLink(row, action = 'approve', role = '') {
  const query = [
    `ticket=${encodeURIComponent(row.id)}`,
    `source=permissions`,
    `action=${encodeURIComponent(action)}`,
    `approver=${encodeURIComponent(approverItcodeForMailRole(row, role) || row.approverItcode)}`,
    `token=mock`
  ]
  if (role) query.push(`identity=${encodeURIComponent(role)}`)
  return `${approvalAppBaseUrl('/mail-approval/action')}?${query.join('&')}`
}

function approverItcodeForMailRole(row, role) {
  const map = {
    relation: row.relatedAccount || row.approverItcode,
    'applicant-manager': row.applicantManager,
    'target-manager': row.targetManager,
    'business-owner': String(role || '').includes(':') ? String(role).split(':')[1] : ((row.businessApprovalTasks || [])[0]?.approver || row.businessApprover),
    'system-admin': row.systemApprover,
    applicant: row.applicantItcode,
    target: row.targetItcode
  }
  const normalizedRole = normalizeApprovalMailRole(role)
  return parseApproverItcode(map[normalizedRole] || row.approverItcode || '')
}

function approvalMailActions(row, role = '') {
  return [
    { value: 'approve', label: '同意', link: approvalActionLink(row, 'approve', role) },
    { value: 'reject', label: '驳回', link: approvalActionLink(row, 'reject', role) }
  ]
}

function isSystemAdminOnlyRequest(row) {
  return ['enable', 'disable', 'workspace-access'].includes(row?.typeKey)
}

function createApprovalNotificationLogs(row) {
  const routeNodeTypes = approvalRouteNodeTypes(row)
  const applicantLink = approvalListLink(row, '', 'applicant', 'applicant')
  const targetLink = approvalListLink(row, '', 'target', 'target')
  const relationLink = approvalListLink(row, '', 'approver', 'relation')
  const applicantManagerLink = approvalListLink(row, '', 'approver', 'applicant-manager')
  const targetManagerLink = approvalListLink(row, '', 'approver', 'target-manager')
  const systemAdminLink = approvalListLink(row, '', 'approver', 'system-admin')
  const relationItcode = parseApproverItcode(row.relatedAccount || row.approverItcode || row.applicantManager)
  const businessTasks = row.businessApprovalTasks?.length ? row.businessApprovalTasks : createBusinessApprovalTasks(row.permissionSnapshot)
  const relationActions = approvalMailActions(row, 'relation')
  const applicantManagerActions = approvalMailActions(row, 'applicant-manager')
  const targetManagerActions = approvalMailActions(row, 'target-manager')
  const systemAdminActions = approvalMailActions(row, 'system-admin')
  const systemAdminMail = {
    role: 'system-admin',
    roleLabel: '系统管理员',
    toName: row.systemApprover || '系统管理员',
    to: approvalPersonMail(row.systemApprover, 'system-admin'),
    subject: `${row.id} 待审批：请确认系统执行`,
    content: `${row.target} 的${row.type}申请等待系统管理员确认，请确认是否允许系统执行账号或权限变更。`,
    link: systemAdminLink,
    linkLabel: '进入审批列表',
    actions: systemAdminActions
  }
  const recipients = [
    {
      role: 'applicant',
      roleLabel: '申请人',
      toName: row.applicant,
      to: row.applicantEmail,
      subject: `${row.id} 账号申请表单已受理`,
      content: `您提交的${row.type}账号申请表单已受理，可点击表单号码进入审批列表查看审核状态。`,
      link: applicantLink,
      linkLabel: '查看审核进度',
      actions: []
    },
    {
      role: 'target',
      roleLabel: '被申请人',
      toName: row.target,
      to: row.email || approvalPersonMail(row.targetItcode, row.target),
      subject: `${row.id} 有一条与你相关的账号权限申请`,
      content: `${row.applicant} 为您提交了${row.type}申请，当前申请已受理。您可以点击表单号码进入审批列表查看审核状态和申请内容。`,
      link: targetLink,
      linkLabel: '查看审核进度',
      actions: []
    },
    ...(!isSystemAdminOnlyRequest(row) ? [{
      role: 'relation',
      roleLabel: '关联人',
      toName: relationItcode || '关联人',
      to: approvalPersonMail(relationItcode, 'relation-owner'),
      subject: `${row.id} 关联关系确认通知`,
      content: `${row.target} 的${row.type}申请需要关联人确认。您可在审批列表中查看详情，请核对后进行处理。`,
      link: relationLink,
      linkLabel: '进入审批列表',
      actions: relationActions
    },
    {
      role: 'applicant-manager',
      roleLabel: '申请人直线经理',
      toName: row.applicantManager,
      to: approvalPersonMail(row.applicantManager, 'applicant-manager'),
      subject: `${row.id} 待审批：请确认申请合理性`,
      content: `${row.applicant} 为${row.target}提交了${row.type}申请，请确认申请是否合理，并进行审批。`,
      link: applicantManagerLink,
      linkLabel: '进入审批列表',
      actions: applicantManagerActions
    },
    {
      role: 'target-manager',
      roleLabel: '被申请人直线经理',
      toName: row.targetManager,
      to: approvalPersonMail(row.targetManager, 'target-manager'),
      subject: `${row.id} 待审批：请确认被申请人权限范围`,
      content: `${row.target} 的${row.type}申请等待确认，请确认申请是否合理，并进行审批。`,
      link: targetManagerLink,
      linkLabel: '进入审批列表',
      actions: targetManagerActions
    },
    ...businessTasks.map((task) => {
      const roleKey = 'business-owner:' + task.approver
      return {
        role: roleKey,
        roleLabel: '业务负责人',
        toName: task.approverName || task.approver,
        to: approvalPersonMail(task.approver, 'business-owner'),
        subject: `${row.id} 待审批：请确认业务归属和权限范围`,
        content: `${row.target} 的${row.type}申请等待确认，请确认申请是否合理，并进行审批。涉及角色：${task.roleNames.join('、') || '待确认'}。`,
        link: approvalListLink(row, '', 'approver', roleKey),
        linkLabel: '进入审批列表',
        actions: approvalMailActions(row, roleKey)
      }
    })] : []),
    systemAdminMail
  ]
  const roleNodeMap = {
    relation: 'relation',
    'applicant-manager': 'applicant-manager',
    'target-manager': 'target-manager',
    'system-admin': 'system-admin'
  }
  const routedRecipients = recipients.filter((item) => {
    if (item.role === 'applicant' || item.role === 'target') return true
    if (String(item.role).startsWith('business-owner')) return routeNodeTypes.includes('business')
    return routeNodeTypes.includes(roleNodeMap[item.role])
  })
  return routedRecipients.map((item, index) => ({
    id: `${row.id}-mail-${index + 1}`,
    ticketNo: row.id,
    time: '2026-07-13 11:45',
    status: 'mock_sent',
    statusLabel: '邮件 mock 已生成，未真实发送',
    ...item
  }))
}

function escapeMailHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function approvalMailMockContent(mail, row) {
  const actions = mail.actions.length
    ? `<div class="mail-actions">${mail.actions.map((action) => `<a class="${action.value === 'approve' ? 'agree' : 'reject'}" href="${escapeMailHtml(action.link)}">${escapeMailHtml(action.label)}</a>`).join('')}</div>`
    : ''
  return `<section class="mail-pane" data-mail-role="${escapeMailHtml(mail.role)}">
    <section class="mail-head">
      <span>${escapeMailHtml(mail.roleLabel)}邮件 mock</span>
      <h1>${escapeMailHtml(mail.subject)}</h1>
    </section>
    <section class="mail-meta">
      <div>收件人：${escapeMailHtml(mail.toName)} &lt;${escapeMailHtml(mail.to)}&gt;</div>
      <div>申请单号：${escapeMailHtml(row.id)} · 申请类型：${escapeMailHtml(row.type)} · 当前节点：${escapeMailHtml(row.node)}</div>
    </section>
    <section class="mail-body">
      <p>${escapeMailHtml(mail.content)}</p>
      <div class="mail-card">
        <div>表单号码：<a class="ticket" href="${escapeMailHtml(mail.link)}">${escapeMailHtml(row.id)}</a></div>
        <div>申请人：${escapeMailHtml(row.applicant)}（${escapeMailHtml(row.applicantItcode)}）</div>
        <div>被申请人：${escapeMailHtml(row.target)}（${escapeMailHtml(row.targetItcode)}）</div>
      </div>
      <a class="progress-link" href="${escapeMailHtml(mail.link)}">${escapeMailHtml(mail.linkLabel || '打开链接')}</a>
      ${actions}
    </section>
    <section class="mail-foot">这是一封 POC mock 邮件，不会真实发送。同意/驳回按钮会进入邮件审批确认页，确认后同步审批列表。</section>
  </section>`
}

function approvalMailMockInboxHtml(row) {
  const tabs = row.notificationLogs.map((mail, index) => `<button type="button" class="mail-tab${index === 0 ? ' active' : ''}" data-mail-role="${escapeMailHtml(mail.role)}">${escapeMailHtml(mail.roleLabel)}</button>`).join('')
  const panes = row.notificationLogs.map((mail, index) => {
    const pane = approvalMailMockContent(mail, row)
    return index === 0 ? pane : pane.replace('class="mail-pane"', 'class="mail-pane hidden"')
  }).join('')
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>邮件 mock 收件箱 - ${escapeMailHtml(row.id)}</title>
<style>
  body { margin: 0; background: #f3f5f8; color: #111827; font-family: Arial, "Microsoft YaHei", sans-serif; }
  .inbox-shell { max-width: 980px; margin: 28px auto; border: 1px solid #d8dee8; background: #fff; box-shadow: 0 16px 42px rgba(15, 23, 42, .12); }
  .inbox-title { border-bottom: 1px solid #e5e7eb; padding: 18px 28px; }
  .inbox-title h1 { margin: 0; color: #101828; font-size: 22px; line-height: 1.35; }
  .inbox-title p { margin: 8px 0 0; color: #667085; font-size: 13px; }
  .mail-tabs { display: flex; gap: 8px; border-bottom: 1px solid #e5e7eb; padding: 12px 18px; background: #f8fafc; overflow-x: auto; }
  .mail-tab { flex: 0 0 auto; min-height: 34px; border: 1px solid #d8e1ee; border-radius: 6px; padding: 0 14px; background: #fff; color: #455468; font-weight: 700; cursor: pointer; }
  .mail-tab.active { border-color: #316dff; background: #316dff; color: #fff; }
  .mail-pane.hidden { display: none; }
  .mail-head { border-bottom: 1px solid #e5e7eb; padding: 20px 28px; }
  .mail-head span { display: inline-block; margin-bottom: 10px; border: 1px solid #bcd3ff; border-radius: 999px; padding: 4px 10px; color: #316dff; font-size: 12px; font-weight: 700; }
  .mail-head h1 { margin: 0; color: #101828; font-size: 22px; line-height: 1.35; }
  .mail-meta { display: grid; gap: 6px; padding: 18px 28px; border-bottom: 1px solid #eef2f7; color: #667085; font-size: 13px; }
  .mail-body { padding: 28px; font-size: 16px; line-height: 1.8; }
  .ticket { color: #2380d9; font-weight: 800; text-decoration: underline; }
  .mail-card { margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f8fafc; }
  .mail-actions { display: flex; gap: 12px; margin-top: 24px; }
  .mail-actions a, .progress-link { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; border-radius: 6px; padding: 0 18px; font-weight: 700; text-decoration: none; }
  .progress-link { background: #316dff; color: #fff; }
  .agree { background: #18a058; color: #fff; }
  .reject { background: #fff1f1; color: #e53935; border: 1px solid #ffc9c9; }
  .mail-foot { padding: 18px 28px 26px; color: #667085; font-size: 13px; }
</style>
</head>
<body>
  <main class="inbox-shell">
    <section class="inbox-title">
      <h1>${escapeMailHtml(row.id)} 邮件 mock 收件箱</h1>
      <p>提交申请后生成的邮件集中展示，可切换查看申请人、被申请人、关联人、两位直线经理和各业务负责人收到的内容。</p>
    </section>
    <nav class="mail-tabs" aria-label="邮件列表">${tabs}</nav>
    ${panes}
  </main>
  <script>
    document.querySelectorAll('.mail-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const role = tab.dataset.mailRole;
        document.querySelectorAll('.mail-tab').forEach((item) => item.classList.toggle('active', item === tab));
        document.querySelectorAll('.mail-pane').forEach((pane) => pane.classList.toggle('hidden', pane.dataset.mailRole !== role));
      });
    });
  <\/script>
</body>
</html>`
}
function persistApprovalMockRow(row) {
  if (typeof window === 'undefined') return
  try {
    const key = 'leaibot-approval-mail-mock-rows'
    const existing = JSON.parse(window.localStorage.getItem(key) || '[]').filter((item) => item.id !== row.id)
    existing.unshift(row)
    window.localStorage.setItem(key, JSON.stringify(existing.slice(0, 10)))
  } catch {}
}

function openApprovalMailMockTabs(row) {
  if (typeof window === 'undefined') return
  persistApprovalMockRow(row)
  const url = window.URL.createObjectURL(new Blob([approvalMailMockInboxHtml(row)], { type: 'text/html;charset=utf-8' }))
  window.open(url, 'approval-mail-inbox-' + row.id)
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000)
}
function closeApprovalNotificationModal() {
  approvalNotificationModal.visible = false
}

function viewSubmittedApproval() {
  if (!submittedApproval.value) return
  closeApprovalNotificationModal()
  activeModule.value = 'approval'
  resetApprovalFilters()
  openApprovalWorkspace(submittedApproval.value, 'view')
}

function copySubmittedTicket() {
  const ticket = submittedApproval.value?.id || ''
  if (!ticket) return
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(ticket).catch(() => {})
  }
  approvalNotificationModal.notice = `已复制申请单号 ${ticket}`
}

function openMailLink(mail) {
  const row = approvals.value.find((item) => item.id === mail.ticketNo)
  if (!row) return
  closeApprovalNotificationModal()
  activeModule.value = 'approval'
  resetApprovalFilters()
  applyApprovalMailContext(mail.role, row.id)
  openApprovalWorkspace(row, mail.actions.length ? 'approve' : 'view')
}

function openMailAction(mail, action) {
  const targetAction = mail.actions.find((item) => item.value === action)
  if (targetAction?.link && typeof window !== 'undefined') {
    window.open(targetAction.link, '_blank')
  }
}

function mailActionNodeType(identity = '') {
  const role = normalizeApprovalMailRole(identity)
  const nodeMap = {
    relation: 'relation',
    'applicant-manager': 'applicant-manager',
    'target-manager': 'target-manager',
    'business-owner': 'business',
    'system-admin': 'system-admin'
  }
  return nodeMap[role] || ''
}

function mailActionMatchesCurrentNode(row, actionRecord) {
  const nodeType = mailActionNodeType(actionRecord.identity)
  if (!nodeType) return true
  if (row.nodeType !== nodeType) return false
  const operator = parseApproverItcode(actionRecord.operator)
  if (!operator) return false
  if (nodeType === 'business') return pendingBusinessTasks(row).some((task) => samePrincipal(task.approver, operator))
  return samePrincipal(row.approverItcode, operator) || (row.handlers || []).some((handler) => samePrincipal(handler, operator))
}

function applyMailApprovalActionToRow(row, actionRecord) {
  if (!row || row.approvalLogs.some((log) => log.mailActionId === actionRecord.id)) return false
  if (!mailActionMatchesCurrentNode(row, actionRecord)) return false
  const approve = actionRecord.action === 'approve'
  if (approve && Object.hasOwn(row.permissionSnapshot || {}, 'businessApprover') && businessApproverError(row.permissionSnapshot.businessApprover)) return false
  row.approvalLogs.push({
    node: row.node,
    action: approve ? 'agree' : 'reject',
    operator: actionRecord.operator || row.approverItcode,
    opinion: approve ? '审批人通过邮件确认同意。' : '审批人通过邮件确认驳回。',
    time: actionRecord.time,
    mailActionId: actionRecord.id
  })
  if (!approve) {
    if (row.nodeType === 'business') {
      const task = pendingBusinessTasks(row).find((item) => samePrincipal(item.approver, actionRecord.operator)) || pendingBusinessTasks(row)[0]
      if (task) {
        task.status = 'rejected'
        task.result = 'reject'
        task.opinion = '业务负责人通过邮件确认驳回。'
        task.handledAt = actionRecord.time
      }
    }
    updateApprovalNode(row, 'rework', {
      status: '已驳回',
      statusKey: 'rejected',
      approverItcode: row.applicantItcode,
      handlers: [row.applicantItcode]
    })
    return true
  }
  if (row.nodeType === 'relation') {
    if (row.applicantPersonType === 'external') {
      enterBusinessApprovalNode(row)
    } else {
      updateApprovalNode(row, 'applicant-manager', {
        approverItcode: row.applicantManager,
        handlers: [row.applicantManager]
      })
    }
  } else if (row.nodeType === 'applicant-manager') {
    if (rowNeedsTargetManager(row)) {
      updateApprovalNode(row, 'target-manager', {
        approverItcode: row.targetManager,
        handlers: [row.targetManager]
      })
    } else {
      enterBusinessApprovalNode(row)
    }
  } else if (row.nodeType === 'target-manager') {
    enterBusinessApprovalNode(row)
  } else if (row.nodeType === 'business') {
    const task = pendingBusinessTasks(row).find((item) => samePrincipal(item.approver, actionRecord.operator)) || pendingBusinessTasks(row)[0]
    if (task) {
      task.status = 'approved'
      task.organizations = task.organizations?.length ? task.organizations : roleGroupsForIds(task.roleIds)
      task.result = 'agree'
      task.opinion = '业务负责人通过邮件确认同意。'
      task.handledAt = actionRecord.time
    }
    row.businessInfo.organizations = businessOrganizationsUnion(row)
    if (pendingBusinessTasks(row).length) {
      syncBusinessApprovalHandlers(row)
    } else {
      completeApprovalExecution(row, actionRecord.time)
    }
  } else if (row.nodeType === 'system-admin') {
    completeApprovalExecution(row, actionRecord.time)
    row.approvalLogs[row.approvalLogs.length - 1].mailActionId = `${actionRecord.id}-execute`
  } else {
    completeApprovalExecution(row, actionRecord.time)
  }
  return true
}

function syncStoredApprovalRows() {
  if (typeof window === 'undefined') return
  try {
    const stored = JSON.parse(window.localStorage.getItem('leaibot-approval-mail-mock-rows') || '[]')
    stored.forEach((item) => {
      if (!approvals.value.some((row) => row.id === item.id)) {
        approvals.value.unshift(createApprovalRow(item))
      }
    })
  } catch {}
}

function syncFirstAccessApprovalRows() {
  if (typeof window === 'undefined') return
  try {
    const stored = JSON.parse(window.localStorage.getItem('leaibot-first-access-applications') || '[]')
    stored.forEach((item) => {
      if (!approvals.value.some((row) => row.id === item.id)) {
        approvals.value.unshift(createApprovalRow(item))
      }
    })
  } catch {}
}

function syncRegisterApprovalRows() {
  if (typeof window === 'undefined') return
  try {
    const rows = JSON.parse(window.localStorage.getItem('leaibot-account-request-status-rows') || '[]')
    rows.forEach((item) => {
      const existing = approvals.value.find((row) => row.id === item.id)
      if (existing) {
        existing.status = item.status
        existing.statusKey = item.statusKey
        existing.node = item.node
        existing.nodeType = item.nodeType || (item.statusKey === 'done' ? 'done' : (item.statusKey === 'rejected' ? 'rework' : existing.nodeType))
        existing.approverItcode = item.approverItcode || existing.approverItcode
        existing.handlers = item.handlers || existing.handlers
        return
      }
      approvals.value.unshift(createApprovalRow({
        id: item.id,
        typeKey: item.typeKey || 'create',
        type: item.type || '创建账号',
        applicant: item.applicant,
        applicantItcode: item.applicantItcode,
        target: item.target,
        targetItcode: item.targetItcode,
        applicantManager: item.applicantManager,
        targetManager: item.targetManager,
        relatedAccount: item.relatedAccount,
        businessApprover: item.businessApprover,
        systemApprover: item.systemApprover,
        approverItcode: item.applicantManager,
        handlers: [item.applicantManager],
        nodeType: item.nodeType || (item.statusKey === 'done' ? 'done' : (item.statusKey === 'rejected' ? 'rework' : 'applicant-manager')),
        approverItcode: item.approverItcode,
        handlers: item.handlers,
        node: item.node,
        status: item.status,
        statusKey: item.statusKey,
        time: item.time,
        reason: item.reason,
        approvalLogs: (item.logs || []).map((log) => ({
          node: log.node,
          action: 'sync',
          operator: 'mail-approval',
          opinion: log.detail,
          time: log.time
        }))
      }))
    })
  } catch {}
}

function syncMailApprovalActions() {
  if (typeof window === 'undefined') return
  syncStoredApprovalRows()
  syncFirstAccessApprovalRows()
  syncRegisterApprovalRows()
  try {
    const actions = JSON.parse(window.localStorage.getItem('leaibot-mail-approval-actions') || '[]')
    let changed = false
    actions.filter((item) => item.source === 'permissions').forEach((actionRecord) => {
      const row = approvals.value.find((item) => item.id === actionRecord.ticket)
      if (row && applyMailApprovalActionToRow(row, actionRecord)) changed = true
    })
    if (changed) {
      records.value.unshift({
        time: '2026-07-13 16:30',
        title: '邮件审批结果已同步',
        detail: '审批列表已读取邮件确认页产生的 mock 审批结果。',
        status: 'POC 记录'
      })
    }
  } catch {}
}

function handleMailApprovalStorage(event) {
  if (event.key === 'leaibot-mail-approval-actions' || event.key === 'leaibot-account-request-status-rows') syncMailApprovalActions()
}
function approvalResultLabel(value) {
  const option = approvalResultOptions.value.find((item) => item.value === value)
  return option?.label || value
}
function userStatusLabel(user) {
  return user?.status === 'enabled' ? '启用' : '已禁用'
}

function parseDateTime(value = '') {
  const normalized = String(value || '').replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date) {
  if (!date) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addMonths(date, months) {
  if (!date) return null
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function daysBetween(left, right) {
  const leftDay = startOfDay(left)
  const rightDay = startOfDay(right)
  if (!leftDay || !rightDay) return 0
  return Math.round((rightDay - leftDay) / 86400000)
}

function adminAutomationDate() {
  return parseDateTime(`${adminCleanupRunDate} 00:00`)
}

function isAdminLoginEntry(log = {}) {
  const entry = String(log.entry || '').toLowerCase()
  return log.result === 'success' && (entry.includes('admin') || entry.includes('后台') || entry.includes('权限管理') || entry.includes('乐享 ai 工作台') || entry.includes('审批列表') || entry.includes('商品运营'))
}

function lastAdminLogin(user) {
  const logs = (user.loginLogs || [])
    .filter(isAdminLoginEntry)
    .map((log) => ({ ...log, date: parseDateTime(log.time) }))
    .filter((log) => log.date)
    .sort((left, right) => right.date - left.date)
  return logs[0] || null
}

function lastAdminLoginText(user) {
  return lastAdminLogin(user)?.time || '从未登录 admin'
}

function hasUserPermissions(user) {
  return !!((user.roleIds || []).length || (user.extraDataPermissionIds || []).length || (user.customDataRules || []).length)
}

function adminCleanupDueDate(user) {
  const lastLog = lastAdminLogin(user)
  return lastLog ? addMonths(lastLog.date, 3) : adminAutomationDate()
}

function adminCleanupDueDateText(user) {
  const date = adminCleanupDueDate(user)
  if (!date) return '-'
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function adminCleanupDaysUntilDue(user) {
  return daysBetween(adminAutomationDate(), adminCleanupDueDate(user))
}

function hasAdminMail(user, subject) {
  return (user.emailNotifications || []).some((mail) => mail.subject === subject)
}

function adminCleanupReminderMail(user) {
  return (user.emailNotifications || []).find((mail) => mail.subject === 'admin 权限清理前提醒') || null
}

function adminCleanupMailSent(user) {
  return adminCleanupDaysUntilDue(user) === 1 && !!adminCleanupReminderMail(user)
}

function shouldCleanupAdminPermission(user) {
  if (!user || user.status !== 'enabled' || user.adminPermissionCleaned || !hasUserPermissions(user)) return false
  return adminCleanupDaysUntilDue(user) <= 0
}

function shouldSendAdminCleanupReminder(user) {
  if (!user || user.status !== 'enabled' || user.adminPermissionCleaned || !hasUserPermissions(user)) return false
  return adminCleanupDaysUntilDue(user) === 1 && !hasAdminMail(user, 'admin 权限清理前提醒')
}

function adminCleanupRiskText(user) {
  if (user?.adminPermissionCleaned) return '已自动清理并邮件通知'
  if (shouldCleanupAdminPermission(user)) return `已到三个月期限，系统将自动清理`
  if (adminCleanupDaysUntilDue(user) === 1) {
    return hasAdminMail(user, 'admin 权限清理前提醒') ? '明天到期，已发送提醒' : '明天到期，待自动提醒'
  }
  return ''
}

function openAdminCleanupEmailPreview(user) {
  const mail = adminCleanupReminderMail(user)
  router.push({
    path: '/agent/permissions/admin-cleanup-email',
    query: {
      account: user.loginAccount,
      name: user.name,
      email: mail?.to || user.email || user.loginAccount,
      due: adminCleanupDueDateText(user),
      lastLogin: lastAdminLoginText(user),
      sentAt: mail?.time || `${adminCleanupRunDate} 09:00`,
      role: userRoles(user).map((role) => role.name).join('、') || '无角色',
      dataCount: String((user.extraDataPermissionIds || []).length + (user.customDataRules || []).length)
    }
  })
}

function sendAdminCleanupReminder(user) {
  if (!user.emailNotifications) user.emailNotifications = []
  user.emailNotifications.unshift({
    time: `${adminCleanupRunDate} 09:00`,
    to: user.email || user.loginAccount,
    subject: 'admin 权限清理前提醒',
    content: `你已接近 3 个月未成功登录 admin，系统将在 ${adminCleanupDueDateText(user)} 自动清理后台角色和数据权限。如仍需使用，请在到期前登录 admin 或重新确认权限。`
  })
  appendUserChange(user, 'admin 清理前邮件提醒', `AUTO-REMIND-${adminCleanupRunDate.replaceAll('-', '')}`, `距离 admin 权限清理还有 1 天，已向 ${user.email || user.loginAccount} 发送提醒邮件。到期日：${adminCleanupDueDateText(user)}。`)
}

function cleanupAdminPermission(user) {
  const removedRoles = userRoles(user).map((role) => role.name)
  const removedDataCount = (user.extraDataPermissionIds || []).length + (user.customDataRules || []).length
  user.roleIds = []
  user.extraDataPermissionIds = []
  user.suppressedRoleDataPermissionIds = []
  user.customDataRules = []
  user.statusKey = 'pending'
  user.adminPermissionCleaned = true
  const lastText = lastAdminLoginText(user)
  const ticketNo = `AUTO-CLEAN-${adminCleanupRunDate.replaceAll('-', '')}`
  const detail = `已到达 3 个月未成功登录 admin 期限，系统自动清理角色${removedRoles.length ? `：${removedRoles.join('、')}` : '权限'}，并清理 ${removedDataCount} 项用户级数据授权。最近 admin 登录：${lastText}。邮件已通知 ${user.email || user.loginAccount}。`
  appendUserChange(user, 'admin 到期自动清理权限', ticketNo, detail)
  if (!user.emailNotifications) user.emailNotifications = []
  user.emailNotifications.unshift({
    time: `${adminCleanupRunDate} 10:40`,
    to: user.email || user.loginAccount,
    subject: 'admin 权限已自动清理通知',
    content: `因已满 3 个月未成功登录 admin，系统已自动清理你的后台角色和数据权限。如需恢复，请重新发起权限申请。`
  })
}

function runAdminPermissionAutomation() {
  const reminderCandidates = adminCleanupReminderCandidates.value
  reminderCandidates.forEach(sendAdminCleanupReminder)
  const cleanupCandidates = adminCleanupCandidates.value
  cleanupCandidates.forEach(cleanupAdminPermission)
  adminAutomationResult.reminded = reminderCandidates.length
  adminAutomationResult.cleaned = cleanupCandidates.length
  adminCleanupNotice.value = `自动巡检完成：清理前一天提醒 ${reminderCandidates.length} 人，到期自动清理 ${cleanupCandidates.length} 人。`
}
function resetUserFilters() {
  userFilters.account = ''
  userFilters.name = ''
  userFilters.bindItcode = ''
}

function emptyUserDraft() {
  return {
    userAccount: `U-${Date.now().toString().slice(-5)}`,
    loginAccount: '',
    name: '',
    applicant: 'admin',
    applicantItcode: 'admin',
    relatedAccount: '',
    applicantManager: 'sunll1',
    targetManager: 'wangxt8',
    requestReason: '需要根据业务职责开通或调整乐享 AI 工作台权限。',
    bindItcode: true,
    mobile: '',
    email: '',
    validUntil: '2026-12-31',
    userType: '内部用户',
    tenant: [tenantOptions[0]],
    organization: [organizationOptions[0]],
    internalAdAccount: '',
    remark: '',
    status: 'enabled',
    statusKey: 'done',
    roleIds: [],
    selectedRoleFunctionPermissionIds: [],
    extraDataPermissionIds: [],
    suppressedRoleDataPermissionIds: [],
    customDataRules: [],
    changeLogs: [],
    loginLogs: []
  }
}

function cloneUser(user) {
  const nextUser = JSON.parse(JSON.stringify(user || emptyUserDraft()))
  nextUser.applicant ||= 'admin'
  nextUser.applicantItcode ||= 'admin'
  nextUser.relatedAccount ||= ''
  nextUser.businessApprover ||= ''
  nextUser.applicantManager ||= 'sunll1'
  nextUser.targetManager ||= 'wangxt8'
  nextUser.requestReason ||= nextUser.remark || '需要根据业务职责开通或调整乐享 AI 工作台权限。'
  nextUser.roleIds ||= []
  const allowedRoleFunctionIds = roleFunctionIds(nextUser.roleIds)
  nextUser.selectedRoleFunctionPermissionIds = Array.isArray(nextUser.selectedRoleFunctionPermissionIds)
    ? sortedUnique(nextUser.selectedRoleFunctionPermissionIds.filter((id) => allowedRoleFunctionIds.includes(id)))
    : allowedRoleFunctionIds
  delete nextUser.extraFunctionPermissionIds
  delete nextUser.suppressedRoleFunctionPermissionIds
  nextUser.extraDataPermissionIds ||= []
  nextUser.suppressedRoleDataPermissionIds ||= []
  nextUser.customDataRules = normalizeCustomDataRules(nextUser.customDataRules || [])
  nextUser.tenant = normalizeTenantList(nextUser.tenant)
  nextUser.organization = normalizeOrganizationList(nextUser.organization)
  nextUser.changeLogs ||= []
  nextUser.loginLogs ||= []
  return nextUser
}

function resetUserWorkspaceErrors() {
  Object.keys(userWorkspace.errors).forEach((key) => {
    userWorkspace.errors[key] = ''
  })
}

function openUserWorkspace(mode, user = null) {
  resetUserWorkspaceErrors()
  userWorkspace.visible = true
  userWorkspace.mode = mode
  userWorkspace.userAccount = user?.userAccount || ''
  userWorkspace.activeTab = 'basic'
  userWorkspace.loginFilter = 'all'
  userWorkspace.generatedApplicationNo = ''
  userWorkspace.notice = mode === 'view' ? '当前为只读详情。' : ''
  userWorkspace.draft = cloneUser(user || emptyUserDraft())
  if (mode !== 'view') userWorkspace.draft.businessApprover = ''
  userWorkspace.dataTab = userWorkspace.draft.customDataRules.length ? 'custom' : 'normal'
}

function closeUserWorkspace() {
  userWorkspace.visible = false
  userWorkspace.notice = ''
  userWorkspace.draft = null
}

function switchUserWorkspaceToEdit() {
  if (userWorkspace.draft) userWorkspace.draft.businessApprover = ''
  userWorkspace.mode = userWorkspace.userAccount ? 'edit' : 'create'
  userWorkspace.dataTab = userWorkspace.draft?.customDataRules?.length ? 'custom' : 'normal'
  userWorkspace.notice = activePendingUserPermissionApproval.value
    ? `申请单号 ${activePendingUserPermissionApproval.value.id} 正在审批，本次仅可编辑基本信息。`
    : ''
}

function setUserType(value) {
  if (userWorkspaceReadonly.value || !userWorkspace.draft) return
  userWorkspace.draft.userType = value
  userWorkspace.draft.bindItcode = value !== '外部用户'
  userWorkspace.errors.relatedAccount = ''
  userWorkspace.errors.targetManager = ''
}

function toggleUserTenant(tenant) {
  if (userWorkspacePermissionReadonly.value || !userWorkspace.draft) return
  toggleId(userWorkspace.draft.tenant, tenant)
  userWorkspace.errors.tenant = ''
}

function toggleUserOrganization(organization) {
  if (userWorkspaceReadonly.value || !userWorkspace.draft) return
  toggleId(userWorkspace.draft.organization, organization)
}

function validateUserWorkspace() {
  resetUserWorkspaceErrors()
  const draft = userWorkspace.draft
  if (!draft) return false
  const externalUser = draft.userType === '外部用户'
  draft.bindItcode = !externalUser
  if (!draft.name && draft.loginAccount) draft.name = draft.loginAccount
  userWorkspace.errors.loginAccount = draft.loginAccount ? '' : (externalUser ? '请填写用户名。' : '请填写用户 ITCode。')
  userWorkspace.errors.relatedAccount = externalUser && !draft.relatedAccount ? '外部人员必须填写关联人 ITCode。' : ''
  userWorkspace.errors.targetManager = !externalUser && !draft.targetManager ? '内部人员必须填写用户直线经理。' : ''
  userWorkspace.errors.tenant = normalizeTenantList(draft.tenant).length ? '' : '请至少选择一个所属租户。'
  userWorkspace.errors.businessApprover = (userWorkspace.mode === 'create' || userPermissionChanged.value) ? businessApproverError(draft.businessApprover) : ''
  userWorkspace.errors.validUntil = draft.validUntil ? '' : '请填写有效期，例如 2026-12-31 或长期有效。'
  const customRuleError = validateCustomTableRules(draft.customDataRules)
  userWorkspace.errors.dataMode = draft.extraDataPermissionIds.length && draft.customDataRules.length ? '普通授权和自定义授权只能选择一种，请先删除其中一类数据权限。' : customRuleError
  const roleConflicts = detectCustomDataRoleConflicts(roleObjectsForIds(draft.roleIds))
  if (roleConflicts.length) {
    userWorkspace.errors.dataMode = roleConflictMessage(roleConflicts)
  }
  if (userPermissionChanged.value && activePendingUserPermissionApproval.value) {
    userWorkspace.errors.dataMode = `申请单号 ${activePendingUserPermissionApproval.value.id} 正在审批，不可重复提交权限变更。`
  }
  return !Object.values(userWorkspace.errors).some(Boolean)
}

function userPermissionState(user) {
  return {
    tenant: normalizeTenantList(user?.tenant),
    roleIds: [...(user?.roleIds || [])],
    extraDataPermissionIds: [...(user?.extraDataPermissionIds || [])],
    selectedRoleFunctionPermissionIds: [...userInheritedFunctionIds(user)],
    suppressedRoleDataPermissionIds: [...(user?.suppressedRoleDataPermissionIds || [])],
    customDataRules: normalizeCustomDataRules(user?.customDataRules || [])
  }
}

function userWithCurrentPermissionState(currentUser, draftUser) {
  const nextUser = cloneUser(draftUser)
  nextUser.tenant = normalizeTenantList(currentUser.tenant)
  nextUser.roleIds = [...(currentUser.roleIds || [])]
  nextUser.extraDataPermissionIds = [...(currentUser.extraDataPermissionIds || [])]
  nextUser.selectedRoleFunctionPermissionIds = [...userInheritedFunctionIds(currentUser)]
  nextUser.suppressedRoleDataPermissionIds = [...(currentUser.suppressedRoleDataPermissionIds || [])]
  nextUser.customDataRules = normalizeCustomDataRules(currentUser.customDataRules || [])
  nextUser.changeLogs = JSON.parse(JSON.stringify(currentUser.changeLogs || []))
  nextUser.loginLogs = JSON.parse(JSON.stringify(currentUser.loginLogs || []))
  return nextUser
}

function saveUserWorkspace() {
  if (!validateUserWorkspace()) {
    userWorkspace.activeTab = userWorkspace.errors.dataMode ? 'data' : 'basic'
    return
  }
  const proposedUser = cloneUser(userWorkspace.draft)
  proposedUser.statusKey = proposedUser.status === 'enabled' ? 'done' : 'rejected'

  if (userWorkspace.mode === 'create') {
    const ticketNo = generateApplicationNo()
    userWorkspace.generatedApplicationNo = ticketNo
    appendCreateUserApproval(proposedUser, ticketNo)
    appendUserChange(proposedUser, '新增用户', ticketNo, '创建账号申请已提交，申请单号由系统自动生成。')
    users.unshift(proposedUser)
    userWorkspace.userAccount = proposedUser.userAccount
    userWorkspace.mode = 'view'
    userWorkspace.draft = cloneUser(proposedUser)
    userWorkspace.notice = `创建账号申请已提交，申请单号 ${ticketNo}。`
    return
  }

  const currentUser = activeUser.value
  if (!currentUser) return
  const index = users.findIndex((user) => user.userAccount === userWorkspace.userAccount)
  if (userPermissionChanged.value) {
    const ticketNo = generateApplicationNo()
    const effectiveUser = userWithCurrentPermissionState(currentUser, proposedUser)
    const detail = '权限变更申请已提交，审批通过前继续使用当前权限。'
    userWorkspace.generatedApplicationNo = ticketNo
    upsertUserApproval(proposedUser, ticketNo, 'change', '权限变更', detail, {
      source: 'user-management',
      targetUserAccount: currentUser.userAccount,
      proposedUserPermission: proposedUser,
      baselineUser: currentUser
    })
    appendUserChange(effectiveUser, '提交权限变更申请', ticketNo, detail)
    if (index >= 0) users.splice(index, 1, effectiveUser)
    userWorkspace.mode = 'view'
    userWorkspace.draft = cloneUser(effectiveUser)
    userWorkspace.notice = `权限变更申请已提交，申请单号 ${ticketNo}；审批通过后生效。`
    return
  }

  appendUserChange(proposedUser, '编辑基本信息', '', '用户基本信息已由系统管理员直接保存。')
  if (index >= 0) users.splice(index, 1, proposedUser)
  userWorkspace.mode = 'view'
  userWorkspace.draft = cloneUser(proposedUser)
  userWorkspace.notice = '用户基本信息已保存。'
}

function sortedIds(ids = []) {
  return [...ids].sort((a, b) => a.localeCompare(b))
}

function sameIdSet(left = [], right = []) {
  return JSON.stringify(sortedIds(left)) === JSON.stringify(sortedIds(right))
}

function hasUserPermissionChanged(original, draft) {
  if (!original || !draft) return false
  return !sameIdSet(normalizeTenantList(original.tenant), normalizeTenantList(draft.tenant))
    || !sameIdSet(original.roleIds, draft.roleIds)
    || !sameIdSet(original.extraDataPermissionIds, draft.extraDataPermissionIds)
    || !sameIdSet(userInheritedFunctionIds(original), userInheritedFunctionIds(draft))
    || !sameIdSet(original.suppressedRoleDataPermissionIds, draft.suppressedRoleDataPermissionIds)
    || customRulesSignature(original.customDataRules) !== customRulesSignature(draft.customDataRules)
}

function pendingUserPermissionApproval(user) {
  if (!user) return null
  return approvals.value.find((row) => row.source === 'user-management'
    && row.typeKey === 'change'
    && row.targetUserAccount === user.userAccount
    && row.statusKey === 'pending') || null
}

function generateApplicationNo() {
  const nextNumber = approvals.value.length + users.length + 11
  return `AP-20260714-${String(nextNumber).padStart(3, '0')}`
}

function userPermissionSnapshot(user, baselineUser = null) {
  const inheritedFunctionIds = userInheritedFunctionIds(user)
  const inheritedDataIds = userInheritedDataIds(user)
  const baseline = baselineUser ? {
    roleIds: sortedUnique(baselineUser.roleIds || []),
    functionIds: sortedUnique(userInheritedFunctionIds(baselineUser)),
    dataIds: sortedUnique([...userInheritedDataIds(baselineUser), ...(baselineUser.extraDataPermissionIds || [])]),
    tenant: normalizeTenantList(baselineUser.tenant)
  } : userPermissionBaselineByItcode(user.loginAccount || user.userAccount)
  const snapshot = {
    selectedRoleIds: [...(user.roleIds || [])],
    copiedFromItcode: '',
    copiedRoleIds: [],
    selectedFunctionPermissionIds: [...inheritedFunctionIds],
    selectedDataPermissionIds: [...new Set([...inheritedDataIds, ...(user.extraDataPermissionIds || [])])],
    manualDataPermissionIds: [...(user.extraDataPermissionIds || [])],
    copiedDataSourceMap: {},
    tenant: normalizeTenantList(user.tenant),
    baseline
  }
  snapshot.changeSummary = buildPermissionChangeSummary(snapshot, {
    targetItcode: user.loginAccount || user.userAccount,
    tenant: snapshot.tenant,
    baseline
  })
  if (baselineUser && customRulesSignature(baselineUser.customDataRules) !== customRulesSignature(user.customDataRules)) {
    snapshot.changeSummary.push({ key: 'custom-data', label: '用户单独数据授权变化', detail: '用户级自定义数据授权规则已调整。' })
  }
  return snapshot
}

function approvalNodeForUser(user) {
  if (user?.userType === '外部用户') return 'relation'
  return samePrincipal('admin', user?.loginAccount || user?.userAccount) ? 'target-manager' : 'applicant-manager'
}

function userApprovalRelationItcode(user) {
  return user?.userType === '外部用户' ? (user.relatedAccount || 'wangxt8') : ''
}

function userApprovalApplicantManagerItcode(user) {
  return user?.applicantManager || 'sunll1'
}

function userApprovalTargetManagerItcode(user) {
  return user?.targetManager || 'wangxt8'
}

function userApprovalBusinessApprover(user) {
  return user?.businessApprover || ''
}

function userApprovalStartState(user, typeKey = '') {
  const nodeType = ['enable', 'disable'].includes(typeKey) ? 'system-admin' : approvalNodeForUser(user)
  const meta = approvalNodeMeta(nodeType)
  const relationItcode = userApprovalRelationItcode(user)
  const applicantManagerItcode = userApprovalApplicantManagerItcode(user)
  const targetManagerItcode = userApprovalTargetManagerItcode(user)
  const approverItcode = nodeType === 'system-admin' ? 'sunzh4' : (nodeType === 'relation' ? relationItcode : (nodeType === 'target-manager' ? targetManagerItcode : applicantManagerItcode))
  return {
    nodeType,
    node: meta.label,
    approverItcode,
    handlers: [approverItcode].filter(Boolean),
    status: meta.status,
    statusKey: meta.statusKey,
    personType: user.userType === '外部用户' ? 'external' : 'internal',
    relatedAccount: relationItcode || user.relatedAccount || '',
    applicantManager: applicantManagerItcode,
    targetManager: targetManagerItcode,
    manager: applicantManagerItcode,
    businessApprover: userApprovalBusinessApprover(user),
    systemApprover: 'sunzh4'
  }
}

function upsertUserApproval(user, applicationNo, typeKey, type, detail, options = {}) {
  const startState = userApprovalStartState(user, typeKey)
  const payload = {
    id: applicationNo,
    source: options.source || '',
    targetUserAccount: options.targetUserAccount || '',
    proposedUserPermission: options.proposedUserPermission ? userPermissionState(options.proposedUserPermission) : null,
    userManagementApplied: false,
    typeKey,
    type,
    applicant: 'admin',
    applicantItcode: 'admin',
    applicantEmail: 'admin@lenovo.com',
    target: user.name || user.loginAccount || user.userAccount,
    targetItcode: user.loginAccount || user.userAccount,
    ...startState,
    mobile: user.mobile,
    email: user.email,
    reason: user.requestReason || detail,
    permissionSnapshot: { ...userPermissionSnapshot(user, options.baselineUser || null), ...(['create', 'change'].includes(typeKey) ? { businessApprover: user.businessApprover || '' } : {}) },
    businessInfo: { tenant: user.tenant || tenantOptions[0], organizations: [] },
    time: '2026-07-14 18:30'
  }
  const index = approvals.value.findIndex((row) => row.id === applicationNo)
  if (index >= 0) {
    approvals.value.splice(index, 1, createApprovalRow({
      ...approvals.value[index],
      ...payload,
      approvalLogs: approvals.value[index].approvalLogs || []
    }))
  } else {
    approvals.value.unshift(createApprovalRow(payload))
  }
  approvalSearch.status = '全部'
}
function appendCreateUserApproval(user, applicationNo) {
  upsertUserApproval(user, applicationNo, 'create', '创建账号', `新建 ${user.name || user.loginAccount} 的乐享 AI 工作台账号。`)
}
function userRoles(user) {
  return allRoles.filter((role) => (user?.roleIds || []).includes(role.id))
}

function userInheritedFunctionIds(user) {
  const allowedIds = [...new Set(userRoles(user).flatMap((role) => role.functionPermissionIds))]
  if (!Array.isArray(user?.selectedRoleFunctionPermissionIds)) return allowedIds
  return allowedIds.filter((id) => user.selectedRoleFunctionPermissionIds.includes(id))
}

function userInheritedDataIds(user) {
  const suppressedIds = user?.suppressedRoleDataPermissionIds || []
  return [...new Set(userRoles(user).flatMap((role) => role.dataPermissionIds))]
    .filter((id) => !suppressedIds.includes(id))
}

function switchUserDataTab(tab) {
  userWorkspace.errors.dataMode = ''
  if (tab === 'normal' && userCustomDataLocked.value) {
    userWorkspace.errors.dataMode = '当前已有自定义授权，需删除自定义授权后才能使用普通授权。'
    return
  }
  if (tab === 'custom' && userNormalDataLocked.value) {
    userWorkspace.errors.dataMode = '当前已有普通授权，需取消普通授权后才能使用自定义授权。'
    return
  }
  userWorkspace.dataTab = tab
}


function toggleUserExtraData(id) {
  if (userWorkspacePermissionReadonly.value || !userWorkspace.draft || userDraftInheritedDataIds.value.includes(id)) return
  if (userCustomDataLocked.value) {
    userWorkspace.errors.dataMode = '当前已有自定义授权，需删除自定义授权后才能使用普通授权。'
    return
  }
  userWorkspace.errors.dataMode = ''
  toggleId(userWorkspace.draft.extraDataPermissionIds, id)
}

function updateUserCustomDataRules(rules) {
  if (userWorkspacePermissionReadonly.value || userNormalDataLocked.value || !userWorkspace.draft) return
  userWorkspace.draft.customDataRules = normalizeCustomDataRules(rules)
  userWorkspace.errors.dataMode = ''
}

function userDraftRoleFunctionPermissions(role) {
  if (!userWorkspace.draft) return []
  const selectedIds = userInheritedFunctionIds(userWorkspace.draft)
  return role.functionPermissionIds.filter((id) => selectedIds.includes(id)).map(functionPermissionDetail).filter(Boolean)
}

function userDraftRoleDataPermissions(role) {
  if (!userWorkspace.draft) return []
  const suppressedIds = userWorkspace.draft.suppressedRoleDataPermissionIds || []
  return role.dataPermissionIds
    .filter((id) => !suppressedIds.includes(id))
    .map((id) => findDataPermission(id))
    .filter(Boolean)
}


function removeUserRoleDataPermission(roleId, permissionId) {
  if (userWorkspacePermissionReadonly.value || !userWorkspace.draft) return
  const role = allRoles.find((item) => item.id === roleId)
  if (!role || !role.dataPermissionIds.includes(permissionId)) return
  if (!userWorkspace.draft.suppressedRoleDataPermissionIds.includes(permissionId)) {
    userWorkspace.draft.suppressedRoleDataPermissionIds.push(permissionId)
  }
  userWorkspace.notice = '已移除该角色带出的数据权限，保存后作为用户级例外生效。'
}

function resetUserRoleDataPermissions(roleId) {
  if (userWorkspacePermissionReadonly.value || !userWorkspace.draft) return
  const role = allRoles.find((item) => item.id === roleId)
  if (!role) return
  userWorkspace.draft.suppressedRoleDataPermissionIds = userWorkspace.draft.suppressedRoleDataPermissionIds.filter((id) => !role.dataPermissionIds.includes(id))
  userWorkspace.notice = '已恢复该角色带出的数据权限，保存后生效。'
}
function openUserRoleModal(user) {
  if (userWorkspace.visible && userWorkspacePermissionReadonly.value) return
  userRoleModal.visible = true
  userRoleModal.keyword = ''
  userRoleModal.selectedIds = [...(user?.roleIds || [])]
  userRoleModal.selectedFunctionIds = [...userInheritedFunctionIds(user || userWorkspace.draft || {})]
  userRoleModal.selectedDataIds = [...userInheritedDataIds(user || userWorkspace.draft || {})]
  userRoleModal.targetUserAccount = user?.userAccount || userWorkspace.userAccount || ''
  const firstRole = allRoles.find((role) => userRoleModal.selectedIds.includes(role.id)) || filteredUserRoleOptions.value[0] || allRoles[0]
  if (firstRole) openUserRoleDetail(firstRole)
  else closeUserRoleDetail()
}

function closeUserRoleModal() {
  userRoleModal.visible = false
  closeUserRoleDetail()
}

function openUserRoleDetail(role) {
  userRoleModal.detailRoleId = role.id
  userRoleModal.detailKeyword = ''
  userRoleModal.activePermissionTab = 'function'
}

function syncUserRoleModalDetailWithResults() {
  window.setTimeout(() => {
    const currentVisible = filteredUserRoleOptions.value.some((role) => role.id === userRoleModal.detailRoleId)
    if (currentVisible) return
    const firstRole = filteredUserRoleOptions.value[0]
    if (firstRole) openUserRoleDetail(firstRole)
    else closeUserRoleDetail()
  }, 0)
}

function closeUserRoleDetail() {
  userRoleModal.detailRoleId = ''
  userRoleModal.detailKeyword = ''
  userRoleModal.activePermissionTab = 'function'
}

function toggleUserRoleSelection(id) {
  const role = allRoles.find((item) => item.id === id)
  const selected = userRoleModal.selectedIds.includes(id)
  toggleId(userRoleModal.selectedIds, id)
  if (!role) return
  if (selected) {
    const remainingRoleFunctionIds = roleFunctionIds(userRoleModal.selectedIds)
    const remainingRoleDataIds = roleDataIds(userRoleModal.selectedIds)
    userRoleModal.selectedFunctionIds = userRoleModal.selectedFunctionIds.filter((functionId) => !role.functionPermissionIds.includes(functionId) || remainingRoleFunctionIds.includes(functionId))
    userRoleModal.selectedDataIds = userRoleModal.selectedDataIds.filter((dataId) => !role.dataPermissionIds.includes(dataId) || remainingRoleDataIds.includes(dataId))
  } else {
    addUniqueIds(userRoleModal.selectedFunctionIds, role.functionPermissionIds)
    addUniqueIds(userRoleModal.selectedDataIds, role.dataPermissionIds)
  }
}

function ensureUserRoleModalDetailRoleSelected() {
  const role = userRoleModalDetailRole.value
  if (role && !userRoleModal.selectedIds.includes(role.id)) userRoleModal.selectedIds.push(role.id)
}

function toggleUserRoleModalFunctionPermission(id) {
  const willSelect = !userRoleModal.selectedFunctionIds.includes(id)
  toggleId(userRoleModal.selectedFunctionIds, id)
  if (willSelect) ensureUserRoleModalDetailRoleSelected()
}

function toggleUserRoleModalDataPermission(id) {
  const willSelect = !userRoleModal.selectedDataIds.includes(id)
  toggleId(userRoleModal.selectedDataIds, id)
  if (willSelect) ensureUserRoleModalDetailRoleSelected()
}

function selectedUserRoleFunctionPermissionIds() {
  return resolvePermissionScopeFunctionIds(
    { selectedFunctionPermissionIds: userRoleModal.selectedFunctionIds },
    roleFunctionIds(userRoleModal.selectedIds)
  )
}

function confirmUserRoleSelection() {
  if (userRoleModalConflicts.value.length) return
  if (userWorkspace.visible && userWorkspacePermissionReadonly.value) {
    closeUserRoleModal()
    return
  }
  const selectedRoleDataIds = roleDataIds(userRoleModal.selectedIds)
  const selectedRoleFunctionIds = selectedUserRoleFunctionPermissionIds()
  if (userWorkspace.visible && userWorkspace.draft) {
    userWorkspace.draft.roleIds = [...userRoleModal.selectedIds]
    userWorkspace.draft.selectedRoleFunctionPermissionIds = selectedRoleFunctionIds
    userWorkspace.draft.suppressedRoleDataPermissionIds = selectedRoleDataIds.filter((id) => !userRoleModal.selectedDataIds.includes(id))
    userWorkspace.notice = '已更新当前用户角色、功能权限和数据权限范围；请通过页面底部按钮提交。'
  } else {
    const user = users.find((item) => item.userAccount === userRoleModal.targetUserAccount)
    if (user) {
      user.roleIds = [...userRoleModal.selectedIds]
      user.selectedRoleFunctionPermissionIds = selectedRoleFunctionIds
      user.suppressedRoleDataPermissionIds = selectedRoleDataIds.filter((id) => !userRoleModal.selectedDataIds.includes(id))
      appendUserChange(user, '设置角色', 'POC-ROLE', `角色已调整为：${userRoles(user).map((role) => role.name).join('、') || '无角色'}。`)
    }
  }
  closeUserRoleModal()
}

function removeUserDraftRole(id) {
  if (userWorkspacePermissionReadonly.value || !userWorkspace.draft) return
  const role = allRoles.find((item) => item.id === id)
  if (role && sensitivityRisk(role.sensitivity) === 'high') {
    userWorkspace.notice = `“${role.name}”是高敏角色，请确认业务影响后再保存。`
  }
  userWorkspace.draft.roleIds = userWorkspace.draft.roleIds.filter((roleId) => roleId !== id)
  userWorkspace.draft.selectedRoleFunctionPermissionIds = userInheritedFunctionIds(userWorkspace.draft)
  if (role) {
    userWorkspace.draft.suppressedRoleDataPermissionIds = (userWorkspace.draft.suppressedRoleDataPermissionIds || []).filter((permissionId) => !role.dataPermissionIds.includes(permissionId))
  }
}

function openUserStatusConfirm(user) {
  userStatusConfirm.visible = true
  userStatusConfirm.action = user.status === 'enabled' ? 'disable' : 'enable'
  userStatusConfirm.userAccount = user.userAccount
  userStatusConfirm.reason = ''
  userStatusConfirm.error = ''
}

function closeUserStatusConfirm() {
  userStatusConfirm.visible = false
}

function confirmUserStatusChange() {
  const user = statusTargetUser.value
  if (!user) return
  if (!userStatusConfirm.reason) {
    userStatusConfirm.error = '请填写操作原因，便于审计追溯。'
    return
  }
  const enabled = userStatusConfirm.action === 'enable'
  user.status = enabled ? 'enabled' : 'disabled'
  user.statusKey = enabled ? 'done' : 'rejected'
  const detail = `系统管理员直接${enabled ? '启用' : '禁用'}账号。原因：${userStatusConfirm.reason}`
  appendUserChange(user, enabled ? '启用用户' : '禁用用户', '', detail)
  closeUserStatusConfirm()
}

function appendUserChange(user, type, ticketNo, detail, time = '2026-07-14 18:30') {
  if (!user.changeLogs) user.changeLogs = []
  user.changeLogs.unshift({
    time,
    type,
    ticketNo,
    detail
  })
}
function openPicker(relation) {
  picker.visible = true
  picker.key = relation.key
  picker.title = relation.label || relation.key
  picker.options = pickerOptions[relation.key] || ['运营 PM', '商品运营', '数据分析师', '外包协作']
}

function choosePicker(item) {
  if (picker.key in form.relation) {
    form.relation[picker.key] = item
  }
  closePicker()
}

function closePicker() {
  picker.visible = false
}

function flattenOrganizations(list, rows = []) {
  list.forEach((org) => {
    rows.push(org)
    if (org.children?.length) flattenOrganizations(org.children, rows)
  })
  return rows
}

function organizationMatchesKeyword(org, keyword) {
  return `${org.name} ${org.code} ${org.owner} ${org.description} ${org.scope}`.toLowerCase().includes(keyword)
}

function findOrganizationById(id, list = organizations) {
  for (const org of list) {
    if (org.id === id) return org
    const child = findOrganizationById(id, org.children || [])
    if (child) return child
  }
  return null
}

function organizationParentName(org) {
  if (!org?.parentId) return '无上级组织'
  return findOrganizationById(org.parentId)?.name || '无上级组织'
}

function selectOrganization(id) {
  selectedOrganizationId.value = id
  dismissOrganizationNotice()
}

function openOrganizationDetail(id) {
  selectedOrganizationId.value = id
  organizationDetailModalVisible.value = true
  dismissOrganizationNotice()
}

function closeOrganizationDetail() {
  organizationDetailModalVisible.value = false
}

function clearOrganizationNoticeTimer() {
  if (!organizationNoticeTimer) return
  window.clearTimeout(organizationNoticeTimer)
  organizationNoticeTimer = null
}

function dismissOrganizationNotice() {
  clearOrganizationNoticeTimer()
  organizationNotice.value = ''
}

function showOrganizationNotice(message) {
  clearOrganizationNoticeTimer()
  organizationNotice.value = message
  organizationNoticeTimer = window.setTimeout(() => {
    organizationNotice.value = ''
    organizationNoticeTimer = null
  }, 3000)
}

function currentDateTimeText() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function resetOrganizationEditorErrors() {
  organizationEditor.errors.tenant = ''
  organizationEditor.errors.name = ''
  organizationEditor.errors.parentId = ''
  organizationEditor.errors.code = ''
  organizationEditor.errors.description = ''
  organizationEditor.notice = ''
}

function openOrganizationChildEditor(parentId) {
  selectedOrganizationId.value = parentId
  openOrganizationEditor('create')
}

function openOrganizationEditor(mode) {
  resetOrganizationEditorErrors()
  organizationEditor.visible = true
  organizationEditor.mode = mode
  const org = mode === 'edit' ? selectedOrganization.value : null
  organizationEditor.orgId = org?.id || ''
  organizationEditor.draft = org
    ? {
        id: org.id,
        tenant: org.tenant || 'leaibot-cn',
        code: org.code,
        name: org.name,
        parentId: org.parentId,
        owner: org.owner,
        creator: org.creator || 'admin',
        status: org.status,
        description: org.description,
        scope: org.scope
      }
    : {
        id: `org-${Date.now()}`,
        tenant: 'leaibot-cn',
        code: '',
        name: '',
        parentId: selectedOrganization.value?.id || 'leai-root',
        owner: '',
        creator: 'admin',
        status: 'enabled',
        description: '',
        scope: '待配置'
      }
}

function closeOrganizationEditor() {
  organizationEditor.visible = false
}

function validateOrganizationEditor() {
  resetOrganizationEditorErrors()
  if (!organizationEditor.draft.tenant) organizationEditor.errors.tenant = '请选择 Tenant。'
  if (!organizationEditor.draft.name) organizationEditor.errors.name = '请填写组织名称。'
  if (organizationEditor.mode === 'create' && !organizationEditor.draft.parentId) organizationEditor.errors.parentId = '请选择上级组织。'
  if (organizationEditor.draft.description.length > 120) organizationEditor.errors.description = '组织描述建议控制在 120 字以内。'
  const duplicateCode = organizationEditor.draft.code && flatOrganizations.value.some((org) => org.code === organizationEditor.draft.code && org.id !== organizationEditor.orgId)
  if (duplicateCode) organizationEditor.errors.code = 'Code 已存在，请更换后再保存。'
  return !(organizationEditor.errors.tenant || organizationEditor.errors.name || organizationEditor.errors.parentId || organizationEditor.errors.code || organizationEditor.errors.description)
}

function appendOrganizationToParent(org) {
  const parent = findOrganizationById(org.parentId)
  if (parent) parent.children.push(org)
  else organizations.push(org)
}

function saveOrganizationEditor() {
  if (!validateOrganizationEditor()) return
  const draft = organizationEditor.draft
  if (organizationEditor.mode === 'create') {
    const parent = findOrganizationById(draft.parentId)
    const org = {
      ...draft,
      level: parent ? parent.level + 1 : 0,
      memberCount: 0,
      updatedAt: currentDateTimeText(),
      members: [],
      children: []
    }
    appendOrganizationToParent(org)
    selectedOrganizationId.value = org.id
    showOrganizationNotice(`已新增组织“${org.name}”。`)
  } else {
    const org = findOrganizationById(organizationEditor.orgId)
    if (!org) return
    org.tenant = draft.tenant
    org.name = draft.name
    org.owner = draft.owner
    org.creator = draft.creator
    org.code = draft.code
    org.status = draft.status
    org.description = draft.description
    org.scope = draft.scope || '待配置'
    org.updatedAt = currentDateTimeText()
    showOrganizationNotice(`已保存“${org.name}”的组织信息。`)
  }
  organizationEditor.notice = '保存成功。'
  organizationEditor.visible = false
}

function resetOrganizationMemberErrors() {
  organizationMemberModal.errors.name = ''
  organizationMemberModal.errors.account = ''
  organizationMemberModal.notice = ''
}

function openOrganizationMemberModal(member = null) {
  resetOrganizationMemberErrors()
  organizationMemberModal.visible = true
  organizationMemberModal.mode = member ? 'edit' : 'create'
  organizationMemberModal.originalOrganizationId = selectedOrganization.value?.id || 'leai-root'
  organizationMemberModal.originalAccount = member?.account || ''
  organizationMemberModal.draft = member
    ? {
        organizationId: selectedOrganization.value?.id || 'leai-root',
        name: member.name,
        account: member.account,
        department: member.department,
        orgRole: member.orgRole,
        permissionIdentity: member.permissionIdentity || '运营人员',
        status: member.status || 'enabled'
      }
    : {
        organizationId: selectedOrganization.value?.id || 'leai-root',
        name: '',
        account: '',
        department: selectedOrganization.value?.name || '',
        orgRole: '成员',
        permissionIdentity: '运营人员',
        status: 'enabled'
      }
}

function closeOrganizationMemberModal() {
  organizationMemberModal.visible = false
}

function validateOrganizationMember() {
  resetOrganizationMemberErrors()
  if (!organizationMemberModal.draft.name) organizationMemberModal.errors.name = '请填写成员姓名。'
  if (!organizationMemberModal.draft.account) organizationMemberModal.errors.account = '请填写成员账号。'
  const org = findOrganizationById(organizationMemberModal.draft.organizationId)
  const duplicate = org?.members.some((member) => {
    if (organizationMemberModal.mode === 'edit' && org.id === organizationMemberModal.originalOrganizationId && member.account === organizationMemberModal.originalAccount) return false
    return member.account === organizationMemberModal.draft.account
  })
  if (duplicate) organizationMemberModal.errors.account = '该成员已在当前组织中。'
  return !(organizationMemberModal.errors.name || organizationMemberModal.errors.account)
}

function saveOrganizationMember() {
  if (!validateOrganizationMember()) return
  const org = findOrganizationById(organizationMemberModal.draft.organizationId)
  if (!org) return
  if (organizationMemberModal.mode === 'edit') {
    const originalOrg = findOrganizationById(organizationMemberModal.originalOrganizationId)
    const originalIndex = originalOrg?.members.findIndex((member) => member.account === organizationMemberModal.originalAccount) ?? -1
    if (originalOrg && originalIndex >= 0) {
      originalOrg.members.splice(originalIndex, 1)
      originalOrg.memberCount = originalOrg.members.length
      originalOrg.updatedAt = currentDateTimeText()
    }
    org.members.push({ ...organizationMemberModal.draft })
    org.memberCount = org.members.length
    org.updatedAt = currentDateTimeText()
    selectedOrganizationId.value = org.id
    showOrganizationNotice(`已更新成员“${organizationMemberModal.draft.name}”。`)
    organizationMemberModal.notice = '保存成功。'
  } else {
    org.members.push({ ...organizationMemberModal.draft })
    org.memberCount = org.members.length
    org.updatedAt = currentDateTimeText()
    selectedOrganizationId.value = org.id
    showOrganizationNotice(`已将“${organizationMemberModal.draft.name}”添加到“${org.name}”。`)
    organizationMemberModal.notice = '添加成功。'
  }
  organizationMemberModal.visible = false
}

function removeOrganizationMember(account) {
  const org = selectedOrganization.value
  if (!org) return
  const member = org.members.find((item) => item.account === account)
  if (!member) return
  if (!window.confirm(`确认将“${member.name}”从“${org.name}”移除吗？`)) return
  org.members = org.members.filter((item) => item.account !== account)
  org.memberCount = org.members.length
  org.updatedAt = currentDateTimeText()
  showOrganizationNotice(`已移除成员“${member.name}”。`)
}

function removeSelectedOrganization() {
  const org = selectedOrganization.value
  if (!org) return
  if (!org.parentId) {
    showOrganizationNotice('根组织不能移除。')
    return
  }
  if (org.children?.length) {
    showOrganizationNotice('该组织下还有下级组织，请先处理下级组织后再移除。')
    return
  }
  if (!window.confirm(`确认移除组织“${org.name}”吗？组织下成员也会从当前 POC 中移除。`)) return
  const parent = findOrganizationById(org.parentId)
  if (!parent) return
  parent.children = parent.children.filter((child) => child.id !== org.id)
  parent.updatedAt = currentDateTimeText()
  selectedOrganizationId.value = parent.id
  organizationDetailModalVisible.value = false
  showOrganizationNotice(`已移除组织“${org.name}”。`)
}

function openEntityModal(title, data) {
  detailModal.visible = true
  detailModal.title = title
  detailModal.data = { ...data }
}

function closeDetailModal() {
  detailModal.visible = false
}

function openRecordModal() {
  recordModalVisible.value = true
}

function resetDemo(identityKey = 'admin') {
  const identity = demoIdentityOptions.find((item) => item.key === identityKey) || demoIdentityOptions[0]
  demoIdentityKey.value = identity.key
  demoIdentityMenuOpen.value = false
  activeModule.value = 'approval'
  syncMailApprovalActions()
  resetApplyStepProgress()
  resetApprovalFilters()
  approvalSearch.viewer = identity.viewer
  approvalSearch.approverItcode = identity.approverItcode
  approvalSearch.status = identity.key === 'admin' || identity.key === 'requester' ? '全部' : '审批中'
  demoRouteBeforeExpanded.value = false
  demoRouteAfterExpanded.value = false
}

function moduleIcon(key) {
  const icons = {
    apply: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h7l3 3v9H5z"></path><path d="M12 4v3h3"></path><path d="M7.5 10h5"></path><path d="M7.5 13h4"></path></svg>',
    approval: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5 16 6v4.2c0 3-2 5.2-6 6.3-4-1.1-6-3.3-6-6.3V6z"></path><path d="m7.3 10.2 1.8 1.8 3.8-4"></path></svg>',
    roles: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 9.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="M2.8 16.5a4.8 4.8 0 0 1 9.4 0"></path><path d="M13.6 5.2a2.5 2.5 0 1 1 0 5"></path><path d="M14.4 12.1a4.2 4.2 0 0 1 2.8 4.4"></path></svg>',
    users: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 9.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"></path><path d="M4.2 17.3a5.8 5.8 0 0 1 11.6 0"></path></svg>',
    orgs: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.2v4"></path><path d="M5 10.2h10"></path><path d="M5 10.2v3"></path><path d="M15 10.2v3"></path><rect x="7.2" y="7.2" width="5.6" height="4" rx="1"></rect><rect x="2.8" y="13.2" width="4.4" height="3.6" rx="1"></rect><rect x="12.8" y="13.2" width="4.4" height="3.6" rx="1"></rect></svg>',
    datasource: '<svg viewBox="0 0 20 20" aria-hidden="true"><ellipse cx="10" cy="5" rx="5.5" ry="2.4"></ellipse><path d="M4.5 5v5c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4V5"></path><path d="M4.5 10v5c0 1.3 2.5 2.4 5.5 2.4s5.5-1.1 5.5-2.4v-5"></path></svg>',
    functions: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3.5" width="5.5" height="5.5" rx="1.2"></rect><rect x="11.5" y="3.5" width="5.5" height="5.5" rx="1.2"></rect><rect x="3" y="12" width="5.5" height="5.5" rx="1.2"></rect><path d="M13.5 14.8h3"></path><path d="M15 13.3v3"></path></svg>',
  }
  return icons[key] || icons.apply
}

function restorePermissionDeepLink() {
  const module = String(route.query.module || '')
  const applicantPersonType = String(route.query.applicantType || '')
  if (['internal', 'external'].includes(applicantPersonType)) {
    form.applicantPersonType = applicantPersonType
  }
  if (modules.some((item) => item.key === module)) {
    activeModule.value = module
  }
  if (String(route.query.entry || '') === 'first-access') {
    const applicantItcode = String(route.query.itcode || '').trim() || form.itcode
    activeModule.value = 'apply'
    selectRequestType('change')
    form.applicant = applicantItcode
    form.itcode = applicantItcode
    form.applicantPersonType = 'internal'
    form.personType = 'internal'
    form.targetUser = ''
    form.targetItcode = applicantItcode
    form.relatedAccount = ''
    form.reason = '首次申请访问乐享 AI 工作台。'
    selectedRoleIds.value = []
    copiedRoleIds.value = []
    selectedFunctionPermissionIds.value = []
    selectedDataPermissionIds.value = []
    manualDataPermissionIds.value = []
    copiedFromItcode.value = ''
    clearCopiedDataSources()
    currentStep.value = 2
    unlockApplyStep(2)
    return
  }
  if (module !== 'approval') return
  resetApprovalFilters()
  const ticket = String(route.query.ticket || '')
  const identity = String(route.query.identity || '')
  if (identity && applyApprovalMailContext(identity, ticket)) return
  approvalSearch.approverItcode = String(route.query.approver || '')
  const viewer = String(route.query.viewer || 'approver')
  approvalSearch.viewer = ['applicant', 'target', 'approver'].includes(viewer) ? viewer : 'approver'
}

onMounted(() => {
  document.title = '权限管理 - 乐享 AI 工作台'
  runAdminPermissionAutomation()
  syncMailApprovalActions()
  restorePermissionDeepLink()
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleMailApprovalStorage)
    window.addEventListener('focus', syncMailApprovalActions)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('storage', handleMailApprovalStorage)
    window.removeEventListener('focus', syncMailApprovalActions)
  }
  clearOrganizationNoticeTimer()
  clearDataSourceNoticeTimer()
  clearFunctionNoticeTimer()
})
</script>

<style scoped>
.permission-page-vue {
  --radius-lg: 12px;
  --form-control-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  width: 100%;
  max-width: none;
  min-width: 0;
  padding: 0;
  color: var(--color-text);
  container-type: inline-size;
}

.demo-reset-menu {
  position: relative;
}

.demo-reset-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.demo-reset-trigger span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.demo-reset-options {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  display: grid;
  gap: 4px;
  width: 190px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px;
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.demo-reset-options button {
  min-height: var(--control-height-md);
  border: 0;
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.demo-reset-options button:hover,
.demo-reset-options button.active {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}


.permission-step h3 {
  margin: 0;
  letter-spacing: 0;
}

.permission-step h3 {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.permission-step p,
.modal-panel p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.hero-actions,
.flow-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permission-page-vue .permission-layout {
  display: grid;
  grid-template-columns: clamp(220px, 26%, 300px) minmax(0, 1fr) !important;
  gap: 16px;
  align-items: stretch;
  min-width: 0;
  height: calc(100vh - 168px);
  min-height: 620px;
  max-height: calc(100vh - 168px);
  overflow: hidden;
}

.permission-workspace {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.permission-module-rail {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  align-self: stretch;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.permission-module-rail-head {
  display: grid;
  flex: 0 0 auto;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.permission-module-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.permission-module-summary b {
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.35;
}

.permission-module-summary span {
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.permission-module-search {
  position: relative;
  display: block;
}

.permission-module-search .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.permission-module-search input {
  width: 100%;
  height: var(--control-height-md);
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.permission-module-search input::placeholder {
  color: var(--color-text-tertiary);
}

.permission-module-search input:focus {
  border-color: var(--color-primary-border);
  background: var(--color-surface);
  box-shadow: var(--focus-ring);
}

.permission-module-groups,
.permission-module-group,
.permission-module-list {
  display: grid;
  gap: 4px;
}

.permission-module-groups {
  flex: 1 1 auto;
  align-content: start;
  min-height: 0;
  padding: 16px 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.permission-module-group {
  gap: 8px;
}

.permission-module-group + .permission-module-group {
  margin-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 12px;
}

.permission-module-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  padding: 0 8px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.permission-module-group-title span:last-child {
  font-variant-numeric: tabular-nums;
}

.permission-module-list button {
  position: relative;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 8px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.permission-module-list button::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1px;
  width: 4px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: transparent;
  content: '';
}

.permission-module-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: var(--color-surface-subtle);
  font-size: 12px;
  font-weight: 700;
}

.permission-module-icon :deep(svg) {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.permission-module-copy {
  display: block;
  min-width: 0;
}

.permission-module-copy b {
  overflow: hidden;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permission-module-copy small {
  display: none;
}

.permission-module-list button.active {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  box-shadow: none;
}

.permission-module-list button.active::before {
  background: var(--color-primary);
}

.permission-module-list button.active .permission-module-icon {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.permission-module-list button.active .permission-module-copy b {
  color: var(--color-primary-active);
}

.permission-module-list button:hover:not(.active) {
  border-color: var(--color-border-subtle);
  background: var(--color-bg-subtle);
}

.permission-module-list button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.permission-module-badge {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 9999px;
  background: var(--color-danger);
  color: var(--color-on-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.permission-module-empty,
.permission-demo-route-empty {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.permission-module-empty {
  padding: 12px 8px;
}

.permission-demo-route {
  flex: 0 0 auto;
  padding: 16px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-surface-quiet);
}

.permission-demo-route-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.permission-demo-route-head b {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.permission-demo-route-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.permission-demo-route-head button {
  min-height: 28px;
  border: 0;
  padding: 0 4px;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.permission-demo-route-head button:focus-visible {
  border-radius: var(--radius-sm);
  outline: none;
  box-shadow: var(--focus-ring);
}

.permission-demo-route-list {
  display: grid;
  gap: 8px;
  max-height: 196px;
  margin: 12px 0 0;
  padding: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  list-style: none;
}

.permission-demo-route-list li {
  position: relative;
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 12px;
  min-height: 40px;
}

.permission-demo-route-list li:not(:last-child)::after {
  position: absolute;
  top: 13px;
  bottom: -8px;
  left: 4px;
  width: 1px;
  background: var(--color-progress-muted);
  content: '';
}

.permission-demo-route-list li.permission-demo-route-fold {
  display: block;
  min-height: 28px;
}

.permission-demo-route-list li.permission-demo-route-fold::after {
  display: none;
}

.permission-demo-route-fold button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 28px;
  border: 0;
  border-radius: var(--radius-sm);
  padding: 0 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text-tertiary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.permission-demo-route-fold button:hover {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.permission-demo-route-fold button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.permission-demo-route-dot {
  position: relative;
  z-index: 1;
  width: 9px;
  height: 9px;
  margin-top: 4px;
  border-radius: 9999px;
  background: var(--color-progress-muted);
}

.permission-demo-route-list li.complete .permission-demo-route-dot,
.permission-demo-route-list li.current .permission-demo-route-dot {
  background: var(--color-primary);
}

.permission-demo-route-list li > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.permission-demo-route-list li b {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.permission-demo-route-list li.current b,
.permission-demo-route-list li.complete b {
  color: var(--color-text);
}

.permission-demo-route-list li.current b {
  font-weight: 700;
}

.permission-demo-route-list li small {
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.35;
}

.permission-demo-route-empty {
  padding-top: 12px;
}

.permission-card {
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  background: var(--color-surface);
  box-shadow: var(--shadow);
}

.permission-card > :deep(.content-section-header) {
  flex: 0 0 auto;
}

.permission-card > :deep(.content-section-header) + * {
  margin-top: 16px;
}

.flow-card {
  overflow: hidden;
  background: var(--color-surface);
}

.flow-card .permission-stage-tabs {
  flex: 0 0 auto;
}

.status-pill,
.table-status,
.scope-head small {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 4px 12px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.permission-stage-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  width: 100%;
  padding: 4px;
  margin-bottom: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow-x: auto;
  scrollbar-width: none;
}

.permission-stage-tabs::-webkit-scrollbar {
  display: none;
}

.permission-stage-tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  min-height: var(--control-height-md);
  border: 0;
  border-radius: var(--radius-md);
  padding: 0 16px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
}

.permission-stage-tabs button.active {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.permission-stage-tabs button.locked,
.permission-stage-tabs button:disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  opacity: 0.58;
}

.permission-step {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--color-text) 45%, transparent) transparent;
}

.permission-step::-webkit-scrollbar,
.permission-module-rail::-webkit-scrollbar,
.permission-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.permission-step::-webkit-scrollbar-thumb,
.permission-module-rail::-webkit-scrollbar-thumb,
.permission-table-wrap::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-text) 45%, transparent);
  border-radius: 9999px;
}

.permission-type-grid,
.permission-scope-grid,
.permission-grid-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.permission-type-grid button,
.permission-scope-grid article,
.permission-grid-list article,
.relation-grid article {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: none;
}

.permission-type-grid button {
  min-height: 168px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.permission-type-grid button span,
.permission-grid-list article span,
.relation-grid article span {
  display: grid;
  place-items: center;
  width: 36px;
  height: var(--control-height-md);
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.permission-type-grid button b,
.permission-grid-list h3,
.relation-grid b {
  display: block;
  margin-top: 12px;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.permission-type-grid button em,
.permission-type-grid button small,
.permission-grid-list p,
.relation-grid p,
.confirm-box p {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-style: normal;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.permission-type-grid button.active {
  border-color: var(--color-primary-border);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-primary-subtle) 100%);
  box-shadow: var(--focus-ring);
}

.permission-type-grid button:hover,
.permission-scope-grid article:hover,
.permission-grid-list article:hover,
.relation-grid article:hover {
  border-color: var(--color-primary-subtle);
  box-shadow: var(--shadow-popover);
}

.permission-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.permission-form-grid label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.permission-form-grid .full {
  grid-column: 1 / -1;
}
.permission-form-grid .relation-account-field,
.permission-form-grid .email-field {
  align-self: start;
  align-content: start;
}

.permission-form-grid .relation-account-field > span:first-child,
.permission-form-grid .email-field > span:first-child {
  min-height: 18px;
  line-height: 18px;
}

.permission-form-grid input,
.permission-form-grid select,
.permission-form-grid textarea {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.permission-form-grid input,
.permission-form-grid select {
  min-height: var(--control-height-md);
  padding: 0 12px;
}

.permission-form-grid textarea {
  padding: 12px 12px;
}

.permission-form-grid input[readonly] {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.permission-form-field {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.field-label.required::before {
  content: '*';
  color: var(--color-danger);
  font-weight: 700;
}

.field-label em {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  border-radius: 9999px;
  padding: 0 8px;
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
}

.field-label em.optional,
.field-label em.autofill {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.field-error,
.field-help {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
}

.field-error {
  color: var(--color-danger);
}

.permission-form-grid input.invalid,
.permission-form-grid select.invalid,
.permission-form-grid textarea.invalid,
.modal-form-field input.invalid {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-popover);
}

.person-type-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.person-type-switch button {
  display: grid;
  gap: 4px;
  min-height: 64px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
}

.person-type-switch button b {
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.35;
}

.person-type-switch button small {
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.person-type-switch button.active {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
  box-shadow: var(--focus-ring);
}

.scope-action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.copy-source-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  background: var(--color-primary-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.copy-source-banner b {
  color: var(--color-text);
  font-size: 13px;
}

.copy-source-banner span {
  flex: 1 1 auto;
  min-width: 0;
}

.scope-source-stack {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.scope-source-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-surface);
}

.source-role-list {
  display: grid;
  gap: 12px;
}

.source-role-card {
  display: grid;
  gap: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.source-role-card.copied {
  background: var(--color-bg-subtle);
}

.approval-role-summary-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.approval-role-summary-row span:not(.sensitivity-badge) {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border-radius: 9999px;
  padding: 0 12px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.source-role-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.source-role-title b {
  display: block;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.source-role-title small {
  display: block;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.bound-permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bound-permission-grid > div {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.source-empty {
  margin-top: 16px;
}

.bound-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.bound-title-row .bound-title {
  margin-bottom: 0;
}

.refresh-btn {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.refresh-btn:hover {
  border-color: var(--color-primary-subtle);
  background: var(--color-primary-subtle);
}

.bound-empty {
  display: block;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}
.bound-title {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.permission-chip-list.compact span {
  gap: 8px;
  min-height: 26px;
  padding: 0 8px;
}

.role-function-card-preview {
  align-items: center;
}

.role-function-card-preview .chip-more {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border-radius: 9999px;
  padding: 0 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
}

.chip-detail-btn {
  min-height: 26px;
  padding: 0 4px;
  font-size: 12px;
}

.role-card-detail-modal {
  width: min(760px, 100%);
}

.role-card-detail-modal h3 {
  margin-top: 8px;
}

.card-detail-table-wrap {
  max-height: 440px;
}
.permission-chip-list span .source-tag {
  min-height: 18px;
  padding: 0 8px;
}

.chip-remove {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 9999px;
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.chip-remove:hover {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}
.scope-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.scope-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-surface);
}

.scope-panel.full {
  grid-column: 1 / -1;
}

.scope-panel-head,
.selected-role-card,
.tree-node-line,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.scope-panel-head {
  margin-bottom: 12px;
}

.scope-panel-head b,
.selected-role-card b,
.scope-empty b {
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.scope-panel-head small,
.selected-role-card small,
.scope-empty p {
  display: block;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.selected-role-list,
.selected-data-tree,
.role-picker-list,
.data-tree-picker {
  display: grid;
  gap: 12px;
}

.selected-role-card {
  align-items: flex-start;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.permission-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-chip-list span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  padding: 0 12px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.scope-empty {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  background: var(--color-bg-subtle);
  text-align: center;
}

.selected-tree-node {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.selected-tree-child {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 1px solid var(--color-border-subtle);
}

.selected-tree-leaf {
  margin-top: 8px;
  padding-left: 16px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.source-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border-radius: 9999px;
  padding: 0 8px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  white-space: nowrap;
}

.source-tag.user {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.source-tag.manual {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.readonly-source-badge,
.readonly-generated-field {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.readonly-generated-field {
  width: 100%;
  margin-top: 8px;
}

.permission-picker-modal {
  width: min(820px, 100%);
}

.role-picker-modal.with-detail {
  width: min(1280px, calc(100vw - 72px));
}

.modal-search-input,
.modal-form-field input {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.modal-search-input {
  margin-top: 16px;
}

.role-picker-list,
.data-tree-picker {
  margin-top: 16px;
  max-height: 420px;
  overflow: auto;
}

.role-picker-row {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 12px;
  align-items: flex-start;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.role-picker-row input,
.data-tree-leaf input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.role-picker-row b,
.data-tree-group > b {
  color: var(--color-text);
  font-size: 13px;
}

.role-picker-row p {
  margin: 4px 0 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.role-picker-row small {
  display: block;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.role-picker-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.role-picker-modal.with-detail .role-picker-layout {
  grid-template-columns: minmax(420px, 0.95fr) minmax(500px, 1.05fr);
  align-items: stretch;
}

.role-picker-check {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.role-picker-row.active {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
  box-shadow: var(--focus-ring);
}

.role-picker-content {
  min-width: 0;
}

.role-picker-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.role-function-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}

.role-function-preview span,
.role-function-preview em {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: var(--radius-md);
  padding: 0 8px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
}

.role-function-preview em {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.role-detail-drawer {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 520px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-bg-subtle);
}

.drawer-close {
  top: 10px;
  right: 10px;
}

.drawer-eyebrow {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.role-detail-drawer h4 {
  margin: 8px 32px 4px 0;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.35;
}

.role-detail-drawer p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.drawer-search {
  flex: 0 0 auto;
  margin-top: 12px;
}

.role-detail-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
  overflow: auto;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.role-detail-table {
  width: 100%;
  border-collapse: collapse;
}

.role-detail-table th,
.role-detail-table td {
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  vertical-align: top;
}

.role-detail-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-bg-subtle);
  color: var(--color-text-tertiary);
  font-weight: 700;
}

.role-detail-table tr:last-child td {
  border-bottom: 0;
}

.role-detail-table td:first-child {
  width: 34%;
  color: var(--color-text);
  font-weight: 700;
}

@media (max-width: 980px) {
  .role-picker-modal.with-detail .role-picker-layout {
    grid-template-columns: 1fr;
  }

  .role-detail-drawer {
    max-height: 360px;
  }
}
.modal-actions {
  justify-content: flex-end;
  margin-top: 20px;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 16px;
}

.modal-form-field {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.copy-user-hints {
  margin-top: 12px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.data-tree-group {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.data-tree-child {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.data-tree-leaf {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.portal-permission-tree,
.role-permission-tree {
  gap: 8px;
}

.permission-tree-root,
.data-tree-group {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.permission-tree-branch,
.data-tree-child {
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
}

.permission-tree-root > summary,
.data-tree-group > summary {
  min-height: var(--control-height-md);
  padding: 0 12px;
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.permission-tree-branch > summary,
.data-tree-child > summary {
  min-height: 32px;
  padding: 0 12px;
  background: transparent;
  color: var(--color-text);
}

.permission-tree-root > summary:hover,
.permission-tree-branch > summary:hover,
.data-tree-group > summary:hover,
.data-tree-child > summary:hover {
  background: var(--color-bg-subtle);
}

.permission-tree-branch-list,
.data-tree-branch-list {
  gap: 4px;
  padding: 8px 8px 8px 24px;
  border-top: 1px solid var(--color-border-subtle);
}

.data-tree-leaf-list {
  display: grid;
  gap: 4px;
  margin: 0 8px 8px 24px;
  padding-left: 12px;
  border-left: 1px solid var(--color-border-subtle);
}

.permission-matrix {
  margin: 0 8px 8px 24px;
  border-color: var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.permission-matrix-head {
  background: var(--color-bg-subtle);
}

.permission-data-check,
.data-tree-leaf {
  border-radius: var(--radius-md);
}

.permission-data-check:hover,
.data-tree-leaf:hover {
  background: var(--color-bg-subtle);
}

.data-tree-group {
  padding: 0;
}

.data-modal-search {
  margin-top: 16px;
}

.data-search-empty {
  margin-top: 12px;
}

.data-tree-child {
  display: block;
  margin-top: 0;
  padding-left: 0;
  border-left: 0;
  color: var(--color-text);
}

.data-tree-leaf {
  min-height: 30px;
  padding: 0 8px;
}
.scope-head,
.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.permission-scope-grid article {
  padding: 16px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.check-row input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.relation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.relation-grid article {
  padding: 12px;
}

.confirm-box,
.execute-summary {
  margin-top: 16px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-primary-subtle);
}

.scope-tenant-grid {
  grid-template-columns: minmax(320px, 1fr);
  margin-top: 12px;
}

.tenant-multi-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.tenant-multi-options.invalid {
  border-color: var(--color-danger);
}

.tenant-multi-options label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.tenant-multi-options label.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
  color: var(--color-primary-hover);
}

.tenant-multi-options input {
  width: 15px;
  height: 15px;
  accent-color: var(--color-primary);
}

.change-summary-panel {
  margin-top: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-surface);
}

.change-summary-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.change-summary-item {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.change-summary-item b {
  display: block;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.change-summary-item p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.readonly-change-summary {
  margin-top: 12px;
}

.approval-change-actions {
  margin-top: 12px;
}

.confirm-box b,
.execute-summary b {
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.approval-route {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.approval-route div {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.approval-route span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.approval-route b {
  display: block;
  margin-top: 12px;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.approval-route small {
  display: block;
  margin-top: 8px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.4;
}

.approval-route .done {
  border-color: var(--color-success);
  background: var(--color-success-subtle);
}

.flow-actions {
  flex: 0 0 auto;
  justify-content: flex-end;
  margin-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 12px;
  min-height: 56px;
  background: linear-gradient(180deg, var(--color-surface), var(--color-surface) 30%);
}

.primary-btn,
.ghost-btn {
  min-height: var(--control-height-md);
  border-radius: var(--radius-md);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.primary-btn {
  border: 1px solid var(--color-primary);
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.ghost-btn {
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

.primary-btn:hover:not(:disabled) {
  border-color: var(--color-primary-hover);
  background: var(--color-primary-hover);
}

.ghost-btn:hover:not(:disabled) {
  border-color: var(--color-primary-border);
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.primary-btn:focus-visible,
.ghost-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.ghost-btn.small {
  min-height: 30px;
  padding: 0 12px;
  font-size: 12px;
}

.danger-outline-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-danger);
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.danger-outline-btn.small {
  min-height: 30px;
  padding: 0 12px;
  font-size: 12px;
}

.danger-outline-btn:hover {
  border-color: var(--color-danger);
  background: var(--color-danger-subtle);
  box-shadow: var(--shadow-popover);
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.segmented {
  display: inline-flex;
  gap: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 4px;
  background: var(--color-bg-subtle);
}

.segmented button {
  border: 0;
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.segmented button.active {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.permission-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

.permission-table th,
.permission-table td {
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 0 12px;
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
  vertical-align: middle;
}

.permission-table th {
  height: 40px;
  color: var(--color-text-tertiary);
  background: var(--color-surface-subtle);
  font-weight: 700;
}

.permission-table td {
  height: 48px;
}

.table-status.done {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.table-status.pending {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.table-status.rejected {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.link-btn {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
}

.link-btn.success {
  color: var(--color-success);
}

.link-btn.danger {
  color: var(--color-danger);
}

.permission-grid-list article {
  padding: 20px;
}

.permission-grid-list.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.permission-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--color-text) 45%, transparent);
  backdrop-filter: none;
}

.permission-picker-layer {
  z-index: 1400;
}

.permission-detail-layer {
  z-index: 1600;
}

.permission-modal.permission-scope-picker-modal.permission-scope-submodal-layer {
  z-index: 1800;
}

.modal-panel {
  position: relative;
  width: min(680px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  padding: 24px;
  box-shadow: var(--shadow-popover);
}

.modal-panel.small {
  width: min(460px, 100%);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: var(--control-height-md);
  height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 20px;
  cursor: pointer;
}

.picker-list {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.picker-list button {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: left;
  background: var(--color-bg-subtle);
  color: var(--color-text);
  cursor: pointer;
}

.detail-list {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
}

.detail-list dt {
  color: var(--color-text-tertiary);
}

.detail-list dd {
  margin: 0;
  color: var(--color-text);
}

.modal-note {
  color: var(--color-text-tertiary);
}

.record-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.record-list article {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 8px 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.record-list time {
  color: var(--color-text-tertiary);
}

.record-list p {
  grid-column: 2 / -1;
  margin: 0;
  color: var(--color-text-secondary);
}

.record-list span {
  color: var(--color-primary);
  font-weight: 700;
}

.approval-filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(360px, 1fr) auto;
  gap: 12px;
  align-items: start;
  margin-bottom: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.approval-filter-bar label,
.approval-handler-filter {
  display: grid;
  grid-template-rows: 18px auto;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.filter-label-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.filter-label-row em {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
}

.approval-filter-bar > .ghost-btn {
  align-self: start;
  margin-top: 24px;
}

.approval-filter-bar input,
.approval-business-form select,
.approval-decision-panel textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.approval-decision-panel textarea {
  min-height: 96px;
  padding: 12px 8px;
  resize: vertical;
}

.handler-combobox {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 4px 8px;
  background: var(--color-surface);
}

.handler-combobox.focused {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.approval-filter-bar .approval-handler-filter .handler-combobox input {
  flex: 1 1 160px;
  width: auto;
  min-width: 140px;
  min-height: 28px;
  border: 0;
  border-radius: 0;
  padding: 0 4px;
  box-shadow: none;
}

.approval-filter-bar .approval-handler-filter .handler-combobox input:focus,
.approval-filter-bar .approval-handler-filter .handler-combobox input:focus-visible {
  border: 0;
  outline: none;
  box-shadow: none;
}

.handler-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 26px;
  border: 1px solid var(--color-primary-border);
  border-radius: 9999px;
  padding: 0 8px 0 12px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.handler-chip button {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 9999px;
  padding: 0;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  cursor: pointer;
}

.handler-chip button:hover {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.handler-suggestion-list {
  position: absolute;
  z-index: 1300;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  display: grid;
  gap: 4px;
  max-height: 220px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px;
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
}

.handler-suggestion-list button {
  min-height: 30px;
  border: 0;
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.handler-suggestion-list button:hover {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.handler-chip-list,
.approval-result-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.handler-chip-list button,
.approval-result-options button {
  min-height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.handler-chip-list button.active,
.approval-result-options button.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.handler-chip-list button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.table-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 120px;
  color: var(--color-text-secondary);
  text-align: center;
}

.table-empty b {
  color: var(--color-text);
  font-size: 13px;
}

.table-empty p {
  margin: 0;
  font-size: 12px;
}

.approval-workspace-modal {
  display: flex;
  flex-direction: column;
  width: min(1040px, 100%);
  max-height: min(760px, calc(100vh - 48px));
  padding: 0;
  overflow: hidden;
}

.approval-workspace-head {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 20px calc(48px + 16px) 16px 24px;
  background: var(--color-surface);
}

.approval-workspace-head h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.4;
}

.approval-workspace-head p {
  margin: 8px 0 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.approval-workspace-body {
  display: grid;
  flex: 1 1 auto;
  gap: 16px;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 20px;
  background: var(--color-bg-subtle);
}

.approval-readonly-panel,
.approval-edit-panel,
.approval-decision-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-surface);
}

.approval-edit-panel {
  background: var(--color-bg-subtle);
}

.approval-decision-panel {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
}

.approval-detail-grid {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) 140px minmax(0, 1fr);
  gap: 12px 16px;
  margin: 0;
}

.approval-full-route-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.approval-full-route-list li {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.approval-full-route-list li > span {
  width: 9px;
  height: 9px;
  margin-top: 4px;
  border-radius: 9999px;
  background: var(--color-progress-muted);
}

.approval-full-route-list li.complete > span,
.approval-full-route-list li.current > span {
  background: var(--color-primary);
}

.approval-full-route-list li.current {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
}

.approval-full-route-list li div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.approval-full-route-list li b {
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.35;
}

.approval-full-route-list li small {
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.35;
}

.approval-detail-grid dt {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.approval-detail-grid dd {
  min-width: 0;
  margin: 0;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.scope-action-bar.inline {
  margin-top: 0;
  justify-content: flex-start;
}

.readonly-scope-stack {
  margin-top: 0;
}

.approval-business-form {
  margin-top: 0;
}

.business-task-list {
  display: grid;
  gap: 12px;
}

.business-task-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.business-task-card.approved {
  border-color: var(--color-success);
  background: var(--color-success-subtle);
}

.business-task-card.rejected {
  border-color: var(--color-danger);
  background: var(--color-danger-subtle);
}

.business-task-card b,
.business-task-card p,
.business-task-card small {
  display: block;
}

.business-task-card p {
  margin: 4px 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.business-task-card small {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.organization-picker {
  padding: 4px 0;
}

.approval-submit-note {
  margin-top: 16px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.approval-submit-note b {
  color: var(--color-text);
  font-size: 13px;
}

.approval-submit-note p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.sticky-actions {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  margin-top: 0;
  border-top: 1px solid var(--color-border-subtle);
  padding: 12px 24px;
  background: var(--color-surface);
  box-shadow: none;
}

.approval-feedback {
  margin-right: auto;
  color: var(--color-success);
  font-size: 12px;
  font-weight: 700;
}

.apply-submit-feedback {
  color: var(--color-danger);
}

.approval-notification-modal {
  width: min(780px, 100%);
}

.simple-notice-modal {
  width: min(1080px, calc(100vw - 96px));
  min-height: 500px;
  padding: 0;
}

.simple-notice-title {
  border-bottom: 1px solid var(--color-border);
  padding: 32px calc(40px + 4px) 12px;
  color: var(--color-text);
  font-size: 20px;
  line-height: 1.4;
}

.simple-notice-body {
  display: grid;
  gap: 24px;
  min-height: 300px;
  padding: calc(40px + 4px) calc(48px + 24px) 24px;
  color: var(--color-text);
}

.simple-notice-body h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 24px;
  line-height: 1.55;
  font-weight: 700;
}

.simple-notice-body p {
  margin: 0;
  color: var(--color-text);
  font-size: 20px;
  line-height: 1.75;
}

.simple-notice-body b {
  color: var(--color-text);
  font-weight: 700;
}

.notice-ticket-link {
  border: 0;
  padding: 0 4px;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.simple-notice-actions {
  margin: 0 calc(40px + 4px);
  border-top: 1px solid var(--color-border);
  padding: 20px 8px 16px;
}
.approval-notification-head {
  display: grid;
  gap: 8px;
  padding-right: calc(40px + 4px);
}

.approval-notification-head h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.4;
}

.approval-notification-head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.approval-notification-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.approval-notification-summary div {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.approval-notification-summary span {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.approval-notification-summary b {
  color: var(--color-text);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.approval-mail-panel {
  border-color: var(--color-success);
  background: var(--color-success-subtle);
}

.approval-mail-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.approval-mail-list.compact {
  margin-top: 12px;
}

.approval-mail-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.approval-mail-list article b {
  color: var(--color-text);
  font-size: 13px;
}

.approval-mail-list article p {
  margin: 8px 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.approval-mail-list article small {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.approval-mail-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  min-width: 160px;
}

.approval-business-form select.invalid,
.approval-decision-panel input.invalid,
.approval-decision-panel textarea.invalid {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-popover);
}
.user-filter-bar {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(180px, 220px) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.user-filter-bar label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.user-filter-bar input,
.user-filter-bar select {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.user-filter-bar input:focus,
.user-filter-bar select:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.user-management-table {
  min-width: 820px;
}

.admin-cleanup-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-primary-subtle);
}

.admin-cleanup-panel b {
  color: var(--color-text);
  font-size: 14px;
}

.admin-cleanup-panel p,
.admin-cleanup-panel small {
  display: block;
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.admin-cleanup-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.admin-cleanup-notice {
  margin-top: 4px;
  margin-bottom: 16px;
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  padding: 12px 12px;
  background: var(--color-success-subtle);
  color: var(--color-success);
  font-size: 13px;
  font-weight: 700;
}

.email-notice-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.email-notice-list article {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.email-notice-list article b {
  color: var(--color-text);
  font-size: 13px;
}

.email-notice-list article p {
  margin: 8px 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.email-notice-list article small {
  color: var(--color-text-tertiary);
  font-size: 12px;
}
.admin-login-cell {
  display: grid;
  gap: 4px;
}

.admin-login-cell b {
  color: var(--color-text);
  font-size: 13px;
}

.admin-login-cell small {
  color: var(--color-warning);
  font-size: 12px;
  line-height: 1.4;
}

.admin-cleanup-mail-link {
  width: fit-content;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-sm);
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  padding: 4px 8px;
  text-align: left;
}

.admin-cleanup-mail-link:hover,
.admin-cleanup-mail-link:focus-visible {
  border-color: var(--color-warning);
  background: var(--color-warning-subtle);
  outline: none;
  box-shadow: var(--shadow-popover);
}
.user-account-cell {
  display: grid;
  gap: 4px;
}

.user-account-cell b {
  color: var(--color-text);
  font-size: 13px;
}

.user-account-cell small {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.user-application-strip {
  display: flex;
  justify-content: flex-start;
  margin: 0;
  border-bottom: 1px solid var(--color-primary-border);
  padding: 12px 24px 16px;
  background: var(--color-bg-subtle);
}

.user-application-strip > div {
  display: grid;
  gap: 4px;
}

.user-application-strip > div b {
  color: var(--color-primary-hover);
  font-size: 13px;
}

.user-application-strip > div span {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.user-application-strip.warning {
  border-bottom-color: var(--color-warning);
  background: var(--color-warning-subtle);
}

.user-application-strip.warning > div b {
  color: var(--color-warning);
}

.user-application-strip label {
  display: grid;
  gap: 8px;
  width: min(320px, 100%);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.user-application-strip input {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.user-application-strip input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.user-application-strip input.invalid {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-popover);
}

.user-application-strip .field-error {
  color: var(--color-danger);
}

.user-editor-modal .role-editor-head {
  padding-right: calc(48px + 24px);
}

.user-modal-status {
  margin-right: 12px;
}

.compact-segmented {
  flex: 0 0 auto;
}

.user-login-table {
  min-width: 920px;
}
.user-editor-modal {
  width: min(1180px, 100%);
}

.user-impact-strip {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.role-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
}

.user-history-table {
  min-width: 760px;
}
.role-filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(180px, 240px) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.role-filter-bar label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.role-management-filter-bar {
  grid-template-columns: minmax(320px, 1fr) minmax(180px, 260px) minmax(180px, 260px) minmax(120px, 150px);
}

.role-management-filter-bar .ghost-btn {
  width: 100%;
  min-height: var(--control-height-md);
}
.role-filter-bar input,
.role-filter-bar select,
.role-basic-form input,
.role-basic-form select,
.role-basic-form textarea,
.selected-permission-table input,
.custom-rule-table input {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.role-basic-form textarea {
  min-height: 88px;
  padding: 12px 8px;
  resize: vertical;
}

.role-filter-bar input:focus,
.role-filter-bar select:focus,
.role-basic-form input:focus,
.role-basic-form select:focus,
.role-basic-form textarea:focus,
.selected-permission-table input:focus,
.custom-rule-table input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.role-result-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.role-result-line b {
  color: var(--color-primary);
  font-size: 12px;
}

.role-table-wrap {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.role-management-table {
  min-width: 980px;
}

.role-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.role-name-cell b {
  color: var(--color-text);
  font-size: 13px;
}

.role-desc-cell {
  max-width: 360px;
  color: var(--color-text-secondary);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  white-space: nowrap;
}

.role-editor-modal {
  display: flex;
  flex-direction: column;
  width: min(1120px, 100%);
  max-height: min(820px, calc(100vh - 48px));
  padding: 0;
  overflow: hidden;
}

.role-editor-head {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 20px 24px 16px;
  background: var(--color-surface);
}

.role-editor-head h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.4;
}

.role-editor-head p {
  margin: 8px 0 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.role-impact-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 12px 24px;
  background: var(--color-bg-subtle);
}

.role-impact-strip span {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 8px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.role-impact-strip b {
  color: var(--color-text);
  font-size: 16px;
}

.role-editor-tabs,
.role-data-tabs {
  display: flex;
  flex: 0 0 auto;
  gap: 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 0 24px;
  background: var(--color-surface);
}

.role-editor-tabs button,
.role-data-tabs button {
  min-height: 44px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.role-editor-tabs button.active,
.role-data-tabs button.active {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}

.role-data-tabs button.locked:not(.active) {
  color: var(--color-text-tertiary);
}

.role-data-tabs button.locked:not(.active)::after {
  content: "需先清空另一类";
  display: inline-flex;
  margin-left: 8px;
  border-radius: 9999px;
  padding: 4px 8px;
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 700;
}

.data-mode-notice {
  display: block;
  margin-bottom: 12px;
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: var(--color-primary-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.data-mode-notice.error {
  border-color: var(--color-danger);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.role-editor-section {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px 20px;
  background: var(--color-bg-subtle);
}

.role-basic-form {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-surface);
}

.user-basic-section {
  display: grid;
  align-content: start;
  gap: 12px;
}

.user-basic-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-basic-section-head.full {
  grid-column: 1 / -1;
  margin: 4px 4px 0;
  border-top: 1px solid var(--color-border-subtle);
  padding: 16px 16px 0;
}

.user-basic-section-head b,
.user-basic-section-head small {
  display: block;
}

.user-basic-section-head b {
  color: var(--color-text);
  font-size: 14px;
}

.user-basic-section-head small {
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.user-basic-form .tenant-multi-options input {
  width: 15px;
  min-height: 15px;
  padding: 0;
}

.sensitivity-badge.low {
  border-color: var(--color-success);
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.sensitivity-badge.medium {
  border-color: var(--color-warning);
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.sensitivity-badge.high {
  border-color: var(--color-danger);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.sensitivity-badge {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  border: 1px solid transparent;
  border-radius: 9999px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.permission-editor-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(420px, 1.3fr);
  gap: 16px;
  min-height: 480px;
}

.permission-tree-panel,
.permission-selected-panel,
.custom-rule-panel {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.permission-subhead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.permission-subhead b {
  color: var(--color-text);
  font-size: 13px;
}

.permission-subhead small {
  display: block;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.role-permission-tree {
  max-height: 520px;
}


.role-permission-tree {
  display: grid;
  gap: 12px;
  max-height: 520px;
  overflow: auto;
  padding-right: 4px;
}

.permission-tree-root,
.permission-tree-branch {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.permission-tree-root summary,
.permission-tree-branch summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 0 12px;
  cursor: pointer;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 700;
  list-style: none;
}

.permission-tree-root summary::-webkit-details-marker,
.permission-tree-branch summary::-webkit-details-marker {
  display: none;
}

.permission-tree-root summary::before,
.permission-tree-branch summary::before {
  content: '›';
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 16px;
  transform: rotate(0deg);
  transition: transform 0.16s ease;
}

.permission-tree-root[open] > summary::before,
.permission-tree-branch[open] > summary::before {
  transform: rotate(90deg);
}

.permission-tree-root summary b,
.permission-tree-branch summary b {
  flex: 1 1 auto;
  min-width: 0;
}

.permission-tree-root summary span,
.permission-tree-branch summary span {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 600;
}

.permission-tree-branch-list {
  display: grid;
  gap: 8px;
  padding: 0 12px 12px 24px;
}

.permission-matrix {
  margin: 0 12px 12px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.permission-matrix-head,
.permission-matrix-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
}

.permission-matrix-head {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.permission-matrix-head span,
.permission-matrix-row > span,
.permission-data-check {
  min-width: 0;
  padding: 8px 12px;
  border-right: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.permission-matrix-head span:last-child,
.permission-matrix-row > span:last-child,
.permission-data-check:last-child {
  border-right: 0;
}

.permission-matrix-row + .permission-matrix-row {
  border-top: 1px solid var(--color-border-subtle);
}

.permission-data-check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.permission-data-check input {
  width: 15px;
  min-height: 15px;
  accent-color: var(--color-primary);
}

.compact-role-card .source-role-title {
  align-items: flex-start;
}
.editor-permission-tree {
  max-height: 560px;
  padding: 4px 4px 4px 0;
}

.drawer-permission-tree {
  max-height: 430px;
}

.role-permission-overview {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.role-permission-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-permission-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  border: 0; border-bottom: 2px solid transparent;
  border-radius: 0;
  padding: 0 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.role-permission-tabs button.active {
  border-bottom-color: var(--color-primary);
  background: transparent;
  color: var(--color-primary);
}

.role-permission-tabs b {
  font-size: 12px;
}

.categorized-permission-tree {
  margin-top: 12px;
}

.permission-item-list {
  display: grid;
  gap: 4px;
  margin: 0 8px 8px 24px;
}

.permission-detail-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.permission-detail-check:hover {
  background: var(--color-bg-subtle);
}

.permission-detail-check input {
  flex: 0 0 auto;
  width: 15px;
  min-height: 15px;
  margin-top: 4px;
  accent-color: var(--color-primary);
}

.permission-detail-check span {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.permission-detail-check b {
  color: var(--color-text);
  font-size: 12px;
  line-height: 1.35;
}

.permission-detail-check small {
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
  word-break: break-all;
}


.role-permission-tree.portal-permission-tree,
.role-permission-tree {
  gap: 8px;
}

.role-permission-tree .permission-tree-root {
  overflow: hidden;
  border-color: var(--color-border-subtle);
}

.role-permission-tree .permission-tree-branch {
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
}

.role-permission-tree .permission-tree-root > summary {
  min-height: var(--control-height-md);
  padding: 0 12px;
  background: var(--color-bg-subtle);
}

.role-permission-tree .permission-tree-branch > summary {
  min-height: 32px;
  padding: 0 12px;
  background: transparent;
}

.role-permission-tree .permission-tree-root > summary:hover,
.role-permission-tree .permission-tree-branch > summary:hover {
  background: var(--color-bg-subtle);
}

.role-permission-tree .permission-tree-branch-list {
  gap: 4px;
  padding: 8px 8px 8px 24px;
  border-top: 1px solid var(--color-border-subtle);
}

.role-permission-tree .permission-matrix {
  margin: 0 8px 8px 24px;
  border-radius: var(--radius-md);
}

.role-permission-tree .permission-data-check:hover {
  background: var(--color-bg-subtle);
}

.editable-permission-matrix .permission-data-check,
.permission-readonly-cell {
  min-height: 40px;
}

.permission-readonly-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 12px;
  border-right: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.permission-readonly-cell .source-tag,
.permission-data-check .source-tag {
  flex: 0 0 auto;
}

.permission-data-check.readonly-check {
  color: var(--color-text-secondary);
  cursor: default;
}

.inline-empty {
  margin-top: 8px;
}
.selected-permission-table,
.custom-rule-table {
  min-width: 0;
}

.selected-permission-table th:first-child,
.selected-permission-table td:first-child {
  width: 64px;
  text-align: center;
}

.selected-permission-table input[type='checkbox'] {
  width: 16px;
  min-height: 16px;
  accent-color: var(--color-primary);
}

.compact-empty {
  margin-top: 0;
}

.role-data-tabs {
  margin: 4px 4px 16px;
}

.custom-rule-head {
  align-items: center;
}

.custom-rule-table {
  min-width: 1040px;
}

.delete-block-box,
.delete-impact-list {
  margin-top: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.delete-block-box {
  border-color: var(--color-danger);
  background: var(--color-danger-subtle);
}

.delete-block-box b {
  color: var(--color-danger);
  font-size: 13px;
}

.delete-block-box p {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.delete-impact-list {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.danger-btn {
  min-height: var(--control-height-md);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  padding: 0 16px;
  background: var(--color-danger);
  color: var(--color-on-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.danger-btn:hover {
  background: var(--color-danger);
}
.org-workspace-card {
  gap: 16px;
}

.org-title-actions,
.org-detail-actions,
.org-member-head,
.org-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.org-title-actions {
  flex: 0 0 auto;
}

.org-panel-head small,
.org-member-head small {
  display: block;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.org-workspace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  flex: 1 1 auto;
}

.org-tree-panel,
.org-detail-panel {
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.org-tree-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: hidden;
}

.org-panel-head b,
.org-member-head b {
  color: var(--color-text);
  font-size: 13px;
}

.org-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 8px;
  background: var(--color-bg-subtle);
}

.org-search-box input {
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.org-chart-search-results {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-height-md);
  overflow-x: auto;
  padding-bottom: 4px;
}

.org-chart-search-results span,
.org-chart-search-results small {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.org-chart-search-results button {
  flex: 0 0 auto;
  min-height: 30px;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.org-chart-search-results button.active {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.org-chart-canvas {
  position: relative;
  display: grid;
  align-content: start;
  gap: 0;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 20px 20px 24px;
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg-subtle) 100%);
}

.org-chart-tier {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 16px;
  min-width: max-content;
}

.org-chart-tier.child-tier {
  align-items: stretch;
  justify-content: flex-start;
  padding-top: 20px;
}

.org-chart-tier.child-tier::before {
  content: '';
  position: absolute;
  top: 0;
  left: 110px;
  right: 110px;
  height: 1px;
  background: var(--color-border);
}

.org-chart-card {
  position: relative;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 8px;
  width: 196px;
  min-height: 112px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 16px 16px;
  background: var(--color-surface);
  color: var(--color-text);
  text-align: center;
  box-shadow: var(--shadow-popover);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.org-chart-card::before {
  content: '';
  width: 18px;
  height: 18px;
  margin-top: 4px;
  border-radius: 50%;
  background: var(--color-primary-subtle);
  box-shadow: inset 0 0 0 5px var(--color-primary);
}

.org-chart-focus {
  display: grid;
  justify-items: center;
  gap: 8px;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: center;
  cursor: pointer;
}

.org-chart-card:hover {
  border-color: var(--color-primary-border);
  box-shadow: var(--shadow-popover);
  transform: translateY(-1px);
}

.org-chart-card.active {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.org-chart-card span {
  order: -1;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.org-chart-card b {
  max-width: 100%;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-chart-card small {
  max-width: 100%;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-chart-card.current-card {
  width: 220px;
  min-height: 122px;
}

.org-chart-card.parent-card {
  width: 220px;
}

.org-chart-card.add-card {
  border-style: dashed;
  border-color: var(--color-danger);
  background: var(--color-surface);
  color: var(--color-text);
}

.org-chart-card.add-card::before {
  display: none;
}

.org-chart-card.add-card b {
  font-size: 24px;
  line-height: 1;
}

.org-chart-detail-btn {
  min-height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.org-chart-detail-btn:hover {
  border-color: var(--color-primary-border);
  background: var(--color-primary-subtle);
}

.org-chart-link {
  position: relative;
  display: grid;
  place-items: center;
  min-width: max-content;
  height: 32px;
}

.org-chart-link.hidden {
  visibility: hidden;
}

.org-chart-link i {
  display: block;
  width: 1px;
  height: 32px;
  background: var(--color-border);
}

.org-chart-link.child-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 1px;
  height: 16px;
  background: var(--color-border);
}

.org-chart-tier.child-tier .org-chart-card::after {
  content: '';
  position: absolute;
  top: -19px;
  left: 50%;
  width: 1px;
  height: 18px;
  background: var(--color-border);
}

.org-empty {
  min-height: 180px;
}

.org-detail-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.org-detail-modal {
  width: min(980px, calc(100vw - 48px));
  max-height: min(82vh, 760px);
  overflow: auto;
}

.org-detail-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 16px;
  background: var(--color-bg-subtle);
}

.org-detail-head h3 {
  margin: 4px 0 0;
  color: var(--color-text);
  font-size: 18px;
  line-height: 1.35;
}

.org-detail-head span:first-child {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.org-detail-head p {
  max-width: 720px;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.org-detail-actions {
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.org-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 16px 16px;
}

.org-detail-grid div {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-surface);
}

.org-detail-grid dt {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 700;
}

.org-detail-grid dd {
  margin: 4px 0 0;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.org-tabs {
  margin: 0 16px 12px;
}

.org-tabs button:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.org-member-head {
  margin: 0 16px 12px;
}

.org-member-table-wrap {
  margin: 0 16px 16px;
}

.org-chart-feedback {
  margin: 0;
}

.org-member-table {
  min-width: 640px;
}

.org-feedback {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: calc(100% - 32px);
  margin: 0 16px 16px;
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: var(--color-success-subtle);
}

.org-feedback span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-feedback button {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-success);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.org-feedback button:hover {
  background: var(--color-success-subtle);
}

.table-status.enabled {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.table-status.disabled {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

.org-editor-modal {
  width: min(760px, 100%);
}

.org-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.org-form-grid label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.org-form-grid label.full {
  grid-column: 1 / -1;
}

.org-form-grid input,
.org-form-grid select,
.org-form-grid textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.org-form-grid textarea {
  min-height: 92px;
  padding: 12px 8px;
  resize: vertical;
}

.org-form-grid input:focus,
.org-form-grid select:focus,
.org-form-grid textarea:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.org-form-grid input.invalid,
.org-form-grid select.invalid,
.org-form-grid textarea.invalid {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-popover);
}

.org-form-grid select:disabled,
.org-form-grid input:read-only {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
}

.org-form-grid .field-error {
  color: var(--color-danger);
  font-size: 12px;
}

.org-form-grid .field-help {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 500;
}


.function-workspace-card {
  gap: 12px;
}

.function-section-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
}

.function-section-actions .ghost-btn,
.function-section-actions .primary-btn {
  min-width: 104px;
  min-height: 40px;
  padding: 0 20px;
  border-radius: var(--radius-md);
  white-space: nowrap;
}
.function-filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(160px, 0.8fr) minmax(130px, 0.6fr) minmax(120px, 0.6fr) auto;
  gap: 12px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.function-filter-bar label,
.function-editor-form label,
.function-interface-add label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.function-filter-bar input,
.function-filter-bar select,
.function-editor-form input,
.function-editor-form select,
.function-editor-form textarea,
.function-interface-add input,
.function-interface-add select {
  width: 100%;
  box-sizing: border-box;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.function-editor-form textarea {
  min-height: 86px;
  padding: 12px 8px;
  resize: vertical;
}

.function-filter-bar input:focus,
.function-filter-bar select:focus,
.function-editor-form input:focus,
.function-editor-form select:focus,
.function-editor-form textarea:focus,
.function-interface-add select:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.function-editor-form input.invalid,
.function-editor-form select.invalid,
.function-editor-form textarea.invalid,
.function-type-radio.invalid {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-popover);
}

.function-workspace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.85fr);
  gap: 16px;
  min-height: 0;
  flex: 1 1 auto;
}
.function-workspace-layout.detail-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.function-table-wrap {
  min-height: 0;
  max-height: none;
}

.function-table {
  min-width: 980px;
}

.function-table tbody tr {
  cursor: pointer;
}

.function-table tbody tr.active {
  background: var(--color-primary-subtle);
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.function-name-cell,
.function-api-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}
.function-tree-name {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: start;
  column-gap: 8px;
  padding-left: calc(var(--tree-depth, 0) * 24px);
}

.function-tree-toggle,
.function-tree-spacer {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
}

.function-tree-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transform: rotate(0deg);
  transition: border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.function-tree-toggle:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.function-tree-toggle.expanded {
  transform: rotate(90deg);
}

.function-tree-spacer {
  display: inline-block;
}

.function-name-cell b,
.function-api-cell b,
.function-detail-block b {
  color: var(--color-text);
  font-size: 13px;
}

.function-name-cell small,
.function-api-cell small {
  color: var(--color-text-tertiary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.function-type-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 9999px;
  padding: 0 8px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.function-detail-panel {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.function-detail-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

.function-desc-cell {
  max-width: 420px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.function-detail-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}


.function-detail-head h3 {
  margin: 4px 0 4px;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.35;
}

.function-detail-head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.function-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 12px;
}

.function-detail-grid div,
.function-detail-block,
.function-usage-grid article,
.function-api-list article {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.function-detail-grid div {
  padding: 12px;
}

.function-detail-grid div.full {
  grid-column: 1 / -1;
}

.function-detail-grid dd {
  margin: 4px 0 0;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.function-detail-block {
  display: grid;
  gap: 12px;
  margin: 0 16px 16px;
  padding: 12px;
}

.function-api-list,
.function-usage-grid {
  display: grid;
  gap: 8px;
}

.function-api-list article,
.function-usage-grid article {
  display: grid;
  gap: 4px;
  padding: 12px;
}

.function-api-list code,
.function-interface-table code {
  color: var(--color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.function-usage-grid p {
  margin: 0;
  color: var(--color-text);
  font-size: 12px;
  line-height: 1.55;
}

.function-feedback {
  flex: 0 0 auto;
  width: fit-content;
}

.function-feedback button {
  border: 0;
  background: transparent;
  color: var(--color-success);
  cursor: pointer;
}

.function-editor-modal {
  width: min(760px, calc(100vw - 48px));
}
.function-create-modal {
  width: min(900px, calc(100vw - 48px));
}

.function-create-tabs {
  margin-top: 12px;
}

.function-create-section {
  display: grid;
  gap: 16px;
  padding-top: 4px;
}

.modal-actions.flat {
  justify-content: flex-end;
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-subtle);
}

.function-editor-form {
  margin-top: 16px;
}

.function-editor-form .full,
.function-interface-editor {
  grid-column: 1 / -1;
}

.function-menu-field {
  position: relative;
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.function-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.function-menu-trigger:hover,
.function-menu-trigger.active {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.function-menu-trigger.invalid {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-popover);
}

.function-menu-trigger i,
.function-menu-column i {
  color: var(--color-text-tertiary);
  font-style: normal;
  line-height: 1;
}

.function-menu-cascade {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 164px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  overflow: hidden;
}

.function-menu-column {
  display: grid;
  align-content: start;
  max-height: 240px;
  overflow: auto;
  border-right: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}

.function-menu-column:last-child {
  border-right: 0;
}

.function-menu-column button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: var(--control-height-md);
  border: 0;
  padding: 0 12px;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.function-menu-column button:hover,
.function-menu-column button.active {
  background: var(--color-primary-subtle);
  color: var(--color-text);
}

.function-menu-column.leaf button {
  justify-content: flex-start;
}
.function-type-radio {
  min-height: var(--control-height-md);
  width: fit-content;
}

.function-interface-editor {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.function-interface-add {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(240px, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.function-interface-add input:read-only {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

.function-interface-table {
  min-width: 0;
}

.function-interface-manual {
  display: grid;
  gap: 12px;
}

.manual-interface-table th:first-child,
.manual-interface-table td:first-child {
  width: 120px;
}

.manual-interface-table th:last-child,
.manual-interface-table td:last-child {
  width: 80px;
  text-align: right;
}

.manual-interface-table input {
  width: 100%;
  min-height: var(--control-height-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
  background: var(--color-surface);
}

.manual-interface-table input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.manual-interface-table .interface-order-input {
  max-width: 90px;
}

.manual-interface-add {
  justify-self: start;
}

.function-interface-empty {
  min-height: 120px;
  background: var(--color-surface);
}
.datasource-workspace-card {
  gap: 0;
}

.datasource-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.datasource-metric-grid article,
.datasource-detail-panel,
.datasource-scope-panel,
.datasource-usage-grid article,
.datasource-log-list article {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.datasource-metric-grid article {
  padding: 12px;
}

.datasource-metric-grid span,
.datasource-metric-grid small,
.datasource-detail-grid dt,
.datasource-scope-panel dt,
.datasource-log-list time,
.datasource-log-list span {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.datasource-metric-grid b {
  display: block;
  margin: 8px 0 4px;
  color: var(--color-text);
  font-size: 20px;
  line-height: 1.2;
}

.datasource-filter-bar {
  display: grid;
  grid-template-columns: minmax(180px, 1.25fr) repeat(4, minmax(118px, 0.8fr)) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.datasource-filter-bar label,
.datasource-editor-form label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.datasource-workspace-layout {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.8fr);
  gap: 16px;
  overflow: hidden;
}

.datasource-workspace-layout.detail-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.datasource-list-panel,
.datasource-detail-panel {
  min-width: 0;
  min-height: 0;
}

.datasource-table-wrap {
  height: 100%;
  max-height: none;
}

.datasource-table tbody tr {
  cursor: pointer;
}

.datasource-table tbody tr.active {
  background: var(--color-primary-subtle);
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.datasource-name-cell {
  display: grid;
  gap: 4px;
}

.datasource-name-cell b {
  color: var(--color-text);
  font-size: 13px;
}

.datasource-name-cell small {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.datasource-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 9999px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.datasource-badge.risk-low {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.datasource-badge.risk-medium {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.datasource-badge.risk-high {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.datasource-detail-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px;
  background: var(--color-bg-subtle);
}

.datasource-drawer-panel {
  min-height: 360px;
  max-height: 100%;
}

.datasource-detail-head {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.datasource-detail-head span {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}

.datasource-detail-head h3 {
  margin: 8px 0 4px;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.35;
}

.datasource-detail-head p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.datasource-detail-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.datasource-detail-tabs button {
  min-height: 32px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.datasource-detail-tabs button.active {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.datasource-detail-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-strong) transparent;
  padding: 12px 8px 4px 0;
}

.datasource-detail-scroll::-webkit-scrollbar {
  width: 6px;
}

.datasource-detail-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.datasource-detail-scroll::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: var(--color-border-strong);
}

.datasource-detail-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-strong);
}

.datasource-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0 0 12px;
}

.datasource-detail-grid div {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.datasource-detail-grid dd,
.datasource-scope-panel dd {
  margin: 4px 0 0;
  color: var(--color-text);
  font-size: 13px;
  line-height: 1.45;
}

.datasource-scope-panel,
.datasource-usage-grid article,
.datasource-log-list article {
  padding: 12px;
}

.datasource-scope-panel b,
.datasource-usage-grid b,
.datasource-log-list b {
  color: var(--color-text);
  font-size: 13px;
}

.datasource-scope-panel dl {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 8px 12px;
  margin: 12px 0 0;
}

.datasource-field-wrap {
  max-height: none;
}

.datasource-usage-grid,
.datasource-log-list {
  display: grid;
  gap: 12px;
}

.datasource-log-list article {
  display: grid;
  gap: 4px;
}

.datasource-log-list p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.datasource-empty {
  height: 100%;
}

.datasource-feedback {
  flex: 0 0 auto;
  margin-top: 12px;
}

.datasource-editor-modal {
  width: min(760px, calc(100vw - 48px));
}

.datasource-checkbox-field .toggle-row {
  min-height: var(--control-height-md);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.datasource-checkbox-field .toggle-row b {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}


.datasource-workspace-card {
  gap: 0;
}

.datasource-filter-bar.compact {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(260px, 1fr) minmax(180px, 220px) 128px;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.datasource-filter-bar.compact .ghost-btn {
  width: 128px;
  min-height: var(--control-height-md);
  justify-content: center;
}

.datasource-filter-bar label,
.datasource-editor-form label {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.datasource-table-wrap.flat {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow: auto;
}

.datasource-table.flat {
  min-width: 980px;
}

.datasource-table-name {
  color: var(--color-text);
  font-size: 13px;
}

.datasource-tree-table tbody tr.directory,
.datasource-tree-table tbody tr.menu {
  background: var(--color-bg-subtle);
}

.datasource-tree-table tbody tr.source .datasource-tree-name b {
  font-size: 13px;
}

.datasource-tree-name small {
  color: var(--color-text-tertiary);
}

.datasource-tree-type.directory,
.datasource-tree-type.menu {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.datasource-tree-type.source {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.datasource-structure-note {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.datasource-url-cell {
  max-width: 280px;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.datasource-empty {
  min-height: 260px;
}

.datasource-feedback {
  flex: 0 0 auto;
  width: fit-content;
  margin-top: 12px;
}

.datasource-editor-modal {
  width: min(820px, calc(100vw - 48px));
}

/* 菜单与数据源共用的树形列表层级：目录分组、路径副文本与行状态各自承担单一语义。 */
.function-tree-row,
.datasource-tree-row {
  transition: background-color 0.16s ease;
}

.function-tree-row:not(.active):hover,
.datasource-tree-row:not(.active):hover {
  background: var(--color-bg-subtle);
}

.function-tree-row.active,
.datasource-tree-row.active {
  background: var(--color-primary-subtle);
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.function-tree-row.directory,
.datasource-tree-row.directory {
  background: var(--color-primary-subtle);
}

.function-tree-row.directory td,
.datasource-tree-row.directory td {
  border-top: 1px solid var(--color-border-subtle);
  border-bottom-color: var(--color-border-subtle);
  padding-top: 8px;
  padding-bottom: 8px;
}

.function-tree-copy {
  min-width: 0;
}

.function-tree-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.function-tree-title b {
  min-width: 0;
}

.function-tree-count {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.function-tree-row.directory .function-tree-title b,
.datasource-tree-row.directory .function-tree-title b {
  font-weight: 700;
}

.function-tree-row .function-tree-name small,
.datasource-tree-row .function-tree-name small {
  display: block;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.35;
}

.function-tree-row .function-tree-name.nested,
.datasource-tree-row .function-tree-name.nested {
  position: relative;
}

.function-tree-row .function-tree-name.nested .function-tree-copy,
.datasource-tree-row .function-tree-name.nested .function-tree-copy {
  border-left: 1px solid var(--color-border-subtle);
  padding-left: 8px;
}

.function-tree-row.directory + .function-tree-row.directory td,
.datasource-tree-row.directory + .datasource-tree-row.directory td {
  border-top-width: 8px;
  border-top-color: var(--color-surface);
}

.function-tree-row .function-tree-toggle:focus-visible,
.datasource-tree-row .function-tree-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
}

.datasource-menu-field {
  position: relative;
}

.datasource-menu-cascade {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: min(720px, calc(100vw - 96px));
}

.datasource-menu-cascade.datasource-root-only {
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  min-height: 0;
}

@media (max-height: 820px) {
  .permission-layout {
    height: calc(100vh - 148px);
    min-height: 520px;
    max-height: calc(100vh - 148px);
  }
}

@container (max-width: 1039px) {
  .permission-type-grid,
  .permission-scope-grid,
  .permission-grid-list,
  .relation-grid,
  .approval-route {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}




@container (max-width: 719px) {
  .permission-form-grid,
  .permission-type-grid,
  .permission-scope-grid,
  .permission-grid-list,
  .permission-grid-list.compact,
  .relation-grid,
  .approval-route {
    grid-template-columns: 1fr;
  }

  .record-list article,
  .detail-list {
    grid-template-columns: 1fr;
  }

  .record-list p {
    grid-column: auto;
  }
}


.status-confirm-modal {
  width: min(860px, 100%);
  max-height: min(760px, calc(100vh - 56px));
  overflow: auto;
}

.direct-status-modal {
  width: min(620px, 100%);
}

.direct-status-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.direct-status-summary > div {
  display: grid;
  gap: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.direct-status-summary span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.direct-status-summary b {
  overflow: hidden;
  color: var(--color-text);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.direct-status-reason {
  display: grid;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.direct-status-reason textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 12px;
  color: var(--color-text);
  font: inherit;
  resize: vertical;
}

.direct-status-reason textarea:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: var(--focus-ring);
}

.status-apply-type-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--color-bg-subtle);
}

.status-apply-type-card > span {
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
}

.status-apply-type-card b {
  display: block;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.45;
}

.status-apply-type-card small {
  display: block;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.45;
}

.status-apply-form {
  margin-top: 0;
}

.person-type-switch.compact button:disabled {
  cursor: default;
  opacity: 1;
}


</style>

<style scoped src="../../components/permissions/permissionDialogFooter.css"></style>
