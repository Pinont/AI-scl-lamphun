import React, { useEffect, useState, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// --- CONFIG ---
// ตั้งค่าความสูงของกราฟตรงนี้ (ตัดปัญหา CSS ไม่โหลด)
const CHART_HEIGHT = 300; 

// จำนวนจุดข้อมูลสูงสุดที่จะแสดงบนกราฟ (ถ้าเกินจะตัดตัวเก่าออก)
const MAX_DATA_POINTS = 20;

export interface ChartData {
  time: string;
  value: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0, color: '#666' }}>{label}</p>
        <p style={{ margin: '5px 0 0', fontWeight: 'bold', color: '#0099FF' }}>
          {Number(payload[0].value).toFixed(2)} ม.
        </p>
      </div>
    );
  }
  return null;
};

export const WaterLevelChart: React.FC = () => {
  // state สำหรับเก็บข้อมูลสะสม (History)
  const [data, setData] = useState<ChartData[]>([]);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ใช้ Ref เพื่อเก็บข้อมูลล่าสุดไว้ใช้ใน interval (แก้ปัญหา closure)
  const dataRef = useRef<ChartData[]>([]);

  const fetchLatestData = async () => {
    try {
      // เรียก API ไปที่ /latest ตามข้อมูลที่คุณได้รับ
      const response = await fetch(`/api/v2/device/latest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: import.meta.env.VITE_API_DEVICE_ID,
          deviceSecretKey: import.meta.env.VITE_API_deviceSecretKey,
          monitorItem: import.meta.env.VITE_API_monitorItem,
        })
      });

      if (!response.ok) throw new Error('API Error');

      const result = await response.json();
      console.log("📦 New Data Packet:", result);

      // ตรวจสอบว่ามีข้อมูล monitorValue หรือไม่
      if (result.monitorValue) {
        const val = parseFloat(result.monitorValue);
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setCurrentValue(val);

        const newItem = {
          time: timeStr,
          value: isNaN(val) ? 0 : val
        };

        // --- หัวใจสำคัญ: เอาข้อมูลใหม่ ต่อท้ายข้อมูลเก่า ---
        const currentData = dataRef.current;
        const newData = [...currentData, newItem];

        // ถ้าข้อมูลเยอะเกินกำหนด ให้ตัดตัวแรกออก (เพื่อให้กราฟวิ่ง)
        if (newData.length > MAX_DATA_POINTS) {
          newData.shift();
        }

        // อัปเดต State และ Ref
        dataRef.current = newData;
        setData(newData);
        setError(null);
      } 
    } catch (err) {
      console.error("Fetch error:", err);
      // ไม่ต้อง setError รุนแรง เพื่อให้กราฟยังค้างค่าเดิมไว้ได้
    }
  };

  useEffect(() => {
    // ดึงข้อมูลครั้งแรกทันที
    fetchLatestData();

    // ดึงข้อมูลใหม่ทุกๆ 5 วินาที (ปรับความเร็วตรงนี้ได้)
    const interval = setInterval(fetchLatestData, 5000); 

    return () => clearInterval(interval);
  }, []);

  // --- Render ---

  // Layout แบบ Inline Style 100% เพื่อแก้ปัญหา width(-1)
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      height: '450px' // กำหนดความสูงรวมของการ์ด
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>ระดับน้ำ (Real-time)</h3>
          <p style={{ margin: '5px 0 0', color: '#888', fontSize: '12px' }}>
             อัปเดตล่าสุด: {currentValue !== null ? `${currentValue.toFixed(2)} ม.` : 'รอข้อมูล...'}
          </p>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#F59E0B' }}></div> เฝ้าระวัง
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#EF4444' }}></div> วิกฤต
          </div>
        </div>
      </div>

      {/* Chart Container - บังคับความสูงตรงนี้เพื่อแก้ Error */}
      <div style={{ width: '100%', height: CHART_HEIGHT, position: 'relative' }}>
        
        {data.length === 0 ? (
          // Loading State
          <div style={{ 
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' 
          }}>
            {error ? <span style={{color: 'red'}}>{error}</span> : "กำลังรอข้อมูลชุดแรก..."}
          </div>
        ) : (
          // Graph
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0099FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0099FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="time" tick={{fontSize: 12}} stroke="#999" />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} stroke="#999" />
              <Tooltip content={<CustomTooltip />} />
              
              <ReferenceLine y={3.5} stroke="#F59E0B" strokeDasharray="3 3" label={{ position: 'right', value: 'เฝ้าระวัง', fontSize: 10, fill: '#F59E0B' }} />
              <ReferenceLine y={4.5} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'right', value: 'วิกฤต', fontSize: 10, fill: '#EF4444' }} />

              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#0099FF" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                isAnimationActive={false} // ปิด animation เพื่อความลื่นไหลเวลาข้อมูลขยับ
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default WaterLevelChart;