import WaterLevelChart from '../components/WaterLevelChart';
import DataCard from '../components/DataCard';
import styles from '../styles/DashboradPage.module.css';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

//import Station from '../pages/Station.tsx'
//import { Routes, Route } from "react-router-dom";

//<Navbar/>
function DashboardPage(){
    return(
        <>


      <div className={styles.cardGrid}>
        
                <DataCard 
                    title="จำนวนสถานี" 
                    value={1} 
                    unit="สถานี" 
                    theme="blue" 
                />
              <DataCard 
                    title="ระดับน้ำ" 
                    value="150.250" 
                    unit="เมตร" 
                    theme="orange" 
                />
               <DataCard 
                    title="ปริมาณน้ำฝนสะสม" 
                    value="50.568" 
                    unit="มิลลิเมตร/ชม." 
                    theme="orange" 
                />
                      
            </div>
      <div className={styles.chartSection}>
        <div className={styles.chartWrapper}>
          <WaterLevelChart />
        </div>
        
        <div className={styles.mapWrapper}>
          <MapView/>
        </div>
      </div>

    </>
    );
}

export default DashboardPage;