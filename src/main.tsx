import { App as AntApp, ConfigProvider } from 'antd'
import enGB from 'antd/locale/en_GB'
import dayjs from 'dayjs'
import 'dayjs/locale/en-au'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { ljTheme } from './theme/ljTheme'

// Australian locale: Monday week start and DD/MM ordering.
dayjs.locale('en-au')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={ljTheme} locale={enGB}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
