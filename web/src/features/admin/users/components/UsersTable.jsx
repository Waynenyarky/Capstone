import React from 'react'
import { Table, Button } from 'antd'
import { useEffect } from 'react'
import { useUsersTable } from "@/features/admin/users/hooks/useUsersTable.js"
import { subscribeUserSignedUp } from "@/features/admin/users/lib/usersEvents.js"

export default function UsersTable() {
  const { users, isLoading, reloadUsers } = useUsersTable()

  const roleLabel = (role) => {
    const key = String(role || '').toLowerCase()
    const map = {
      admin: 'Admin',
      business_owner: 'Business Owner',
      user: 'User',
      lgu_officer: 'LGU Officer',
      lgu_manager: 'LGU Manager',
      inspector: 'LGU Inspector',
      cso: 'CSO',
    }
    if (map[key]) return map[key]

    const words = key.split(/[_\s]+/).filter(Boolean)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  useEffect(() => {
    const unsubscribe = subscribeUserSignedUp(() => {
      reloadUsers()
    })
    return unsubscribe
  }, [reloadUsers])

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, rec) => [rec?.firstName, rec?.lastName].filter(Boolean).join(' '),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <span>{roleLabel(role)}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => (val ? new Date(val).toLocaleString() : ''),
    },
  ]

  return (
    <>
      <Table 
        title={() => 'Users'} 
        footer={() => <Button onClick={reloadUsers} loading={isLoading}>Refresh</Button> }
        rowKey="id" 
        columns={columns} 
        dataSource={users} 
        loading={isLoading} 
        pagination={false} 
        />
    </>
  )
}
