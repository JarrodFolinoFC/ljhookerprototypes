import { MenuOutlined } from '@ant-design/icons'
import { Breadcrumb, Button, Drawer, Layout, Menu } from 'antd'
import { useState, type ReactNode } from 'react'

const NAV = [
  { key: 'due-date-changes', label: 'Due date changes' },
  { key: 'jobs', label: 'Jobs', disabled: true },
  { key: 'inspections', label: 'Inspections', disabled: true },
]

export function AppShell({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Layout className="app">
      <Layout.Header className="app-header">
        <div className="container app-header__inner">
          <a className="wordmark" href="/" aria-label="LJ Hooker City Residential reporting home">
            <span className="wordmark__brand">LJ Hooker</span>
            <span className="wordmark__office">City Residential</span>
          </a>
          <Menu
            className="app-header__menu"
            mode="horizontal"
            selectedKeys={['due-date-changes']}
            items={NAV}
            disabledOverflow
          />
          <Button
            className="app-header__burger"
            type="text"
            icon={<MenuOutlined />}
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </Layout.Header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} placement="right" size={280} title="Reporting">
        <Menu mode="vertical" selectedKeys={['due-date-changes']} items={NAV} style={{ borderInlineEnd: 0 }} />
      </Drawer>

      <section className="hero">
        <div className="container">
          <Breadcrumb
            className="hero__crumbs"
            items={[{ title: 'Property management' }, { title: 'Reporting' }, { title }]}
          />
          <h1 className="hero__title">{title}</h1>
          <p className="hero__intro">{intro}</p>
        </div>
      </section>

      <Layout.Content className="app-content">
        <div className="container">{children}</div>
      </Layout.Content>

      <Layout.Footer className="app-footer">
        <div className="container app-footer__inner">
          <div>
            <div className="wordmark wordmark--footer">
              <span className="wordmark__brand">LJ Hooker</span>
              <span className="wordmark__office">City Residential</span>
            </div>
            <p className="app-footer__note">Internal reporting · Data synced from PropertyMe</p>
          </div>
          <p className="app-footer__legal">© {new Date().getFullYear()} LJ Hooker City Residential</p>
        </div>
      </Layout.Footer>
    </Layout>
  )
}
