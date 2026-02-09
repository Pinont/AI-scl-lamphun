import WaterLevelChart from '../components/WaterLevelChart';
import DataCard from '../components/DataCard';
import Header from '../components/Header';

function DashboardPage(){
    return(
        <>
      <Header />
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
        
        {/* ใบที่ 1 */}
                <DataCard 
                    title="จำนวนสถานี" 
                    value={1} 
                    unit="สถานี" 
                    theme="orange" 
                />
              {/* ใบที่ 2 */}
              <DataCard 
                    title="ระดับน้ำ" 
                    value="150.250" 
                    unit="เมตร" 
                    theme="blue" 
                />
                {/* ใบที่ 3 */}
               <DataCard 
                    title="ปริมาณน้ำฝนสะสม" 
                    value="50.568" 
                    unit="มิลลิเมตร/ชม." 
                    theme="blue" 
                />
                      
            </div>
      {/* --- พื้นที่วางกราฟ --- */}
      <div style={{ display: 'grid', gap: '24px' }}>
      <WaterLevelChart />
      </div>
    </>
    );
}

export default DashboardPage;