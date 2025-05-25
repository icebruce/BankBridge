import React from 'react';
import styles from '../example.module.css';

const ExampleComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>CSS Modules with Tailwind</h1>
      
      <div className={styles.customElement}>
        <p>This element uses both CSS Module classes and inline Tailwind classes</p>
        <button className={`${styles.button} mt-4`}>
          Click Me
        </button>
      </div>
      
      {/* You can also use Tailwind classes directly */}
      <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
        This uses direct Tailwind classes
      </div>
    </div>
  );
};

export default ExampleComponent; 