import styles from './Footer.module.scss'

export default function Footer() {
  const date = new Date().getFullYear()
  return (
    <footer id="footer" className={styles.footer}>
      <span>© {date} Panchao. All Rights Reserved.京ICP备xxxxxx号</span>
    </footer>
  )
}
