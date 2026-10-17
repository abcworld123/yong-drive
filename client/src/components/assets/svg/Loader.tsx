import { memo } from 'react';
import styles from 'styles/Icons.module.scss';

function Loader() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={styles.loader} preserveAspectRatio="xMidYMid">
      <g transform="translate(20 50)">
        <circle cx="0" cy="0" r="6" fill="#222222">
          <animateTransform attributeName="transform" type="scale" begin="-0.3024193548387097s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8064516129032259s" repeatCount="indefinite" />
        </circle>
      </g><g transform="translate(40 50)">
        <circle cx="0" cy="0" r="6" fill="#222222">
          <animateTransform attributeName="transform" type="scale" begin="-0.20161290322580647s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8064516129032259s" repeatCount="indefinite" />
        </circle>
      </g><g transform="translate(60 50)">
        <circle cx="0" cy="0" r="6" fill="#222222">
          <animateTransform attributeName="transform" type="scale" begin="-0.10080645161290323s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8064516129032259s" repeatCount="indefinite" />
        </circle>
      </g><g transform="translate(80 50)">
        <circle cx="0" cy="0" r="6" fill="#222222">
          <animateTransform attributeName="transform" type="scale" begin="0s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8064516129032259s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

export default memo(Loader);
