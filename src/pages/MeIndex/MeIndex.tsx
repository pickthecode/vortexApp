import styles from "./MeIndex.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faCloudArrowUp,faFile} from "@fortawesome/free-solid-svg-icons";
import { Link } from "@tanstack/react-router";

export default function MeIndex() {
  return (
    <div className={styles.container}>
      <div className={styles.infoWrapper}>
        <div className={styles.userInfo}>
          <Link to="/me/set" className={styles.userSet}>
            <FontAwesomeIcon icon={faCircleInfo} />
            <span>个人资料</span>
          </Link>
          <Link to="/me/upload" className={styles.userUpload}>
            <FontAwesomeIcon icon={faCloudArrowUp} />
            <span>上传文件</span>
          </Link>
        </div>
        <Link to="/me/files" className={styles.userFile}>
          <FontAwesomeIcon icon={faFile} />
          <span>我的文件</span>
        </Link>
      </div>
      <div className={styles.graphWrapper}></div>
    </div>
  );
}
