<script setup>
import { computed, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n'
import { NButton, NInput, NSelect, NTag } from 'naive-ui';
import { useGlobalState } from '../../store'
import { api } from '../../api'

const { loading, openSettings } = useGlobalState()
const message = useMessage()

const { t } = useI18n({
    messages: {
        en: {
            title: 'Role Management',
            add: 'Add Role',
            edit: 'Edit',
            save: 'Save',
            success: 'Success',
            role: 'Role',
            prefix: 'Prefix',
            domains: 'Domains',
            actions: 'Actions',
            noData: 'No roles configured',
            rolePlaceholder: 'role name',
            prefixPlaceholder: 'prefix',
            domainsPlaceholder: 'Select or input domains',
            addRoleTitle: 'Add Role',
            editRoleTitle: 'Edit Role',
            pleaseInputRole: 'Please input role name',
            duplicateRole: 'Role name already exists',
        },
        zh: {
            title: '角色管理',
            add: '新增角色',
            edit: '编辑',
            save: '保存',
            success: '成功',
            role: '角色',
            prefix: '前缀',
            domains: '域名',
            actions: '操作',
            noData: '当前没有角色配置',
            rolePlaceholder: '角色名称',
            prefixPlaceholder: '前缀',
            domainsPlaceholder: '选择或输入域名',
            addRoleTitle: '新增角色',
            editRoleTitle: '编辑角色',
            pleaseInputRole: '请输入角色名称',
            duplicateRole: '角色名称已存在',
        }
    }
});

const roles = ref([])
const showRoleModal = ref(false)
const editingIndex = ref(-1)
const formData = ref({
    role: '',
    prefix: '',
    domains: []
})

const domainOptions = computed(() => {
    return (openSettings.value?.domains || []).map(domain => ({
        label: domain,
        value: domain
    }))
})

const modalTitle = computed(() => editingIndex.value >= 0 ? t('editRoleTitle') : t('addRoleTitle'))

const fetchRoles = async () => {
    try {
        const { roles: results } = await api.fetch('/admin/roles')
        roles.value = results || []
    } catch (error) {
        console.log(error)
        message.error(error.message || 'error')
    }
}

const openCreateModal = () => {
    editingIndex.value = -1
    formData.value = {
        role: '',
        prefix: '',
        domains: []
    }
    showRoleModal.value = true
}

const openEditModal = (row, index) => {
    editingIndex.value = index
    formData.value = {
        role: row.role || '',
        prefix: row.prefix || '',
        domains: Array.isArray(row.domains) ? [...row.domains] : []
    }
    showRoleModal.value = true
}

const saveRole = async () => {
    const roleName = formData.value.role.trim()
    if (!roleName) {
        message.error(t('pleaseInputRole'))
        return
    }
    const duplicated = roles.value.some((item, index) => item.role === roleName && index !== editingIndex.value)
    if (duplicated) {
        message.error(t('duplicateRole'))
        return
    }
    const nextRoles = roles.value.map(item => ({
        role: item.role,
        prefix: item.prefix || '',
        domains: Array.isArray(item.domains) ? [...item.domains] : []
    }))
    const nextRole = {
        role: roleName,
        prefix: formData.value.prefix?.trim() || null,
        domains: (formData.value.domains || []).map(item => item.trim()).filter(Boolean)
    }
    if (editingIndex.value >= 0) {
        nextRoles.splice(editingIndex.value, 1, nextRole)
    } else {
        nextRoles.push(nextRole)
    }
    try {
        await api.fetch('/admin/roles', {
            method: 'POST',
            body: JSON.stringify({ roles: nextRoles })
        })
        message.success(t('success'))
        showRoleModal.value = false
        await fetchRoles()
    } catch (error) {
        console.log(error)
        message.error(error.message || 'error')
    }
}

const columns = [
    {
        title: t('role'),
        key: 'role',
        render(row) {
            return h(NTag, {
                bordered: false,
                type: 'info'
            }, { default: () => row.role })
        }
    },
    {
        title: t('prefix'),
        key: 'prefix',
        render(row) {
            return row.prefix || '-'
        }
    },
    {
        title: t('domains'),
        key: 'domains',
        render(row) {
            return Array.isArray(row.domains) && row.domains.length > 0 ? row.domains.join(', ') : '-'
        }
    },
    {
        title: t('actions'),
        key: 'actions',
        render(row, index) {
            return h(NButton, {
                size: 'small',
                onClick: () => openEditModal(row, index)
            }, { default: () => t('edit') })
        }
    }
]

onMounted(async () => {
    await fetchRoles()
})
</script>

<template>
    <div style="margin-top: 10px;">
        <n-space justify="end" style="margin-bottom: 12px;">
            <n-button type="primary" @click="openCreateModal">
                {{ t('add') }}
            </n-button>
        </n-space>

        <n-empty v-if="roles.length === 0" :description="t('noData')" />
        <n-data-table
            v-else
            :columns="columns"
            :data="roles"
            :bordered="false"
            striped
        />

        <n-modal v-model:show="showRoleModal" preset="card" :title="modalTitle" style="max-width: 640px;">
            <n-space vertical>
                <n-input v-model:value="formData.role" :placeholder="t('rolePlaceholder')" />
                <n-input v-model:value="formData.prefix" :placeholder="t('prefixPlaceholder')" />
                <n-select
                    v-model:value="formData.domains"
                    :options="domainOptions"
                    multiple
                    filterable
                    tag
                    :placeholder="t('domainsPlaceholder')"
                />
                <n-space justify="end">
                    <n-button :loading="loading" type="primary" @click="saveRole">
                        {{ t('save') }}
                    </n-button>
                </n-space>
            </n-space>
        </n-modal>
    </div>
</template>
