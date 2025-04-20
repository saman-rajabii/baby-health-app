import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Button, 
  Card, 
  Row, 
  Col,
  Spin,
  Divider,
  Tag,
  Space,
  Empty,
  notification,
  Progress,
  Table,
  Modal,
  Alert,
  Statistic,
  Badge
} from 'antd';
import { PlusOutlined, ClockCircleOutlined, HistoryOutlined, DashboardOutlined, DeleteOutlined } from '@ant-design/icons';
import { contractionCounterService, contractionLogService } from '../../services/api';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

// Match the API schema for contraction logs
interface ContractionLogData {
  id: string;
  counterId: string;
  startedAt: string;
  endedAt: string;
  duration: number; // duration in seconds
  createdAt: string;
  updatedAt: string;
}

// Match the API schema for contraction counters
interface ContractionCounterData {
  id: string;
  userId: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
  contractionLogs?: ContractionLogData[];
}

const ContractionCounter: React.FC = () => {
  const [counters, setCounters] = useState<ContractionCounterData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(0);
  const [api, contextHolder] = notification.useNotification();
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);
  const [logsModalVisible, setLogsModalVisible] = useState<boolean>(false);
  const [selectedLogs, setSelectedLogs] = useState<ContractionLogData[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  
  // Manual contraction tracking
  const [recordingStartTime, setRecordingStartTime] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingActive, setRecordingActive] = useState<boolean>(false);
  const [pressureLevel, setPressureLevel] = useState<number>(0);
  
  // Track active contraction in progress
  const [activeContraction, setActiveContraction] = useState<{
    counterId: string;
    startedAt: string;
  } | null>(null);
  
  const fetchCounters = async () => {
    try {
      setLoading(true);
      const data = await contractionCounterService.getAllCounters();
      setCounters(data);
    } catch (err: any) {
      console.error('Error fetching contraction counters:', err);
      api.error({
        message: 'Error',
        description: 'Failed to load contraction counters. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLogsForCounter = async (counterId: string) => {
    try {
      setLogsLoading(true);
      const logs = await contractionLogService.getLogsByCounter(counterId);
      setSelectedLogs(logs);
    } catch (err: any) {
      console.error('Error fetching contraction logs:', err);
      api.error({
        message: 'Error',
        description: 'Failed to load contraction logs. Please try again later.',
      });
    } finally {
      setLogsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCounters();
    
    // Set up timer for updating contraction time
    const timerInterval = setInterval(() => {
      setTimer(prev => prev + 1);
      
      // Update the recording duration if actively recording
      if (recordingActive && recordingStartTime) {
        const now = Date.now();
        const start = new Date(recordingStartTime).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setRecordingDuration(elapsed);
        
        // Simulate increasing pressure over time for the gauge
        // Maximum pressure reached after 20 seconds
        setPressureLevel(Math.min(100, (elapsed / 20) * 100));
      }
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [recordingActive, recordingStartTime]);
  
  const createNewCounter = async () => {
    try {
      // Create new counter with active status
      const newCounter = await contractionCounterService.createCounter({
        status: 'active'
      });
      
      setCounters(prevCounters => [newCounter, ...prevCounters]);
      api.success({
        message: 'Success',
        description: 'New contraction counter session created successfully!',
      });
    } catch (err: any) {
      console.error('Error creating contraction counter:', err);
      api.error({
        message: 'Error',
        description: 'Failed to create new contraction counter. Please try again.',
      });
    }
  };
  
  const closeCounter = async (counterId: string) => {
    try {
      const updatedCounter = await contractionCounterService.closeCounter(counterId);
      // Update the local state
      setCounters(prevCounters => prevCounters.map(c => 
        c.id === counterId ? updatedCounter : c
      ));
      
      api.success({
        message: 'Success',
        description: 'Contraction counter session closed successfully!',
      });
    } catch (err: any) {
      console.error('Error closing contraction counter:', err);
      api.error({
        message: 'Error',
        description: 'Failed to close contraction counter. Please try again.',
      });
    }
  };
  
  // Add function to delete a counter
  const deleteCounter = async (counterId: string) => {
    try {
      await contractionCounterService.deleteCounter(counterId);
      
      // Remove the counter from local state
      setCounters(prevCounters => prevCounters.filter(c => c.id !== counterId));
      
      api.success({
        message: 'Success',
        description: 'Contraction counter session deleted successfully!',
      });
    } catch (err: any) {
      console.error('Error deleting contraction counter:', err);
      api.error({
        message: 'Error',
        description: 'Failed to delete contraction counter. Please try again.',
      });
    }
  };
  
  const startContraction = (counterId: string) => {
    const startTime = new Date().toISOString();
    setActiveContraction({
      counterId,
      startedAt: startTime
    });
    
    api.info({
      message: 'Contraction Started',
      description: 'Recording contraction in progress...',
      duration: 2,
    });
  };
  
  const endContraction = async (counterId: string) => {
    if (!activeContraction || activeContraction.counterId !== counterId) {
      return;
    }
    
    try {
      const endTime = new Date().toISOString();
      // Calculate duration in seconds
      const startTime = new Date(activeContraction.startedAt).getTime();
      const endTimeMs = new Date(endTime).getTime();
      const durationSeconds = Math.floor((endTimeMs - startTime) / 1000);
      
      const newLog = await contractionLogService.createLog({
        counterId,
        startedAt: activeContraction.startedAt,
        endedAt: endTime,
        duration: durationSeconds
      });
      
      // Update the counter in local state to include the new log
      setCounters(prevCounters => prevCounters.map(counter => {
        if (counter.id === counterId) {
          const updatedLogs = [...(counter.contractionLogs || []), newLog];
          return {
            ...counter,
            contractionLogs: updatedLogs
          };
        }
        return counter;
      }));
      
      // Reset active contraction
      setActiveContraction(null);
      
      api.success({
        message: 'Success',
        description: `Contraction recorded: ${formatDurationSeconds(newLog.duration)}`,
      });
    } catch (err: any) {
      console.error('Error ending contraction:', err);
      api.error({
        message: 'Error',
        description: 'Failed to record contraction. Please try again.',
      });
      
      // Reset active contraction on error as well
      setActiveContraction(null);
    }
  };
  
  // Manual contraction recording with the button
  const handleContractionPress = () => {
    // ONLY record the start time and update UI state
    // Do NOT call any API service here
    const startTime = new Date().toISOString();
    setRecordingStartTime(startTime);
    setRecordingActive(true);
    setRecordingDuration(0);
    setPressureLevel(0);
    
    // Visual feedback that we're recording
    api.info({
      message: 'Recording contraction',
      description: 'Keep pressing until the contraction ends',
      duration: 2,
    });
  };
  
  const handleContractionRelease = async () => {
    if (!recordingStartTime || !recordingActive) return;
    
    // Store values before resetting state
    const startTime = recordingStartTime;
    const endTime = new Date().toISOString();
    
    // Reset UI state immediately
    setRecordingActive(false);
    setRecordingStartTime(null);
    setRecordingDuration(0);
    setPressureLevel(0);
    
    try {
      // Calculate duration in seconds
      const startTimeMs = new Date(startTime).getTime();
      const endTimeMs = new Date(endTime).getTime();
      const durationSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);
      
      // First check if we have an active counter, if not create a new one
      let counterId: string;
      let existingActiveCounter = counters.find(c => c.status === 'active');
      
      if (!existingActiveCounter) {
        // Create a new counter session
        const newCounter = await contractionCounterService.createCounter({
          status: 'active'
        });
        counterId = newCounter.id;
        setCounters(prevCounters => [newCounter, ...prevCounters]);
      } else {
        counterId = existingActiveCounter.id;
      }
      
      // Create the contraction log with our start and end times
      const newLog = await contractionLogService.createLog({
        counterId,
        startedAt: startTime,
        endedAt: endTime,
        duration: durationSeconds
      });
      
      // Update the counter in local state to include the new log
      setCounters(prevCounters => 
        prevCounters.map(counter => {
          if (counter.id === counterId) {
            const updatedLogs = [...(counter.contractionLogs || []), newLog];
            return {
              ...counter,
              contractionLogs: updatedLogs
            };
          }
          return counter;
        })
      );
      
      api.success({
        message: 'Contraction Recorded',
        description: `Duration: ${formatDurationSeconds(newLog.duration)}`,
        duration: 3,
      });
    } catch (err: any) {
      console.error('Error recording contraction:', err);
      api.error({
        message: 'Error',
        description: 'Failed to record contraction. Please try again.',
      });
    }
  };
  
  const deleteContractionLog = async (logId: string) => {
    try {
      await contractionLogService.deleteLog(logId);
      
      // Update local state
      if (selectedCounterId) {
        setSelectedLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        
        // Also update the main counters state
        setCounters(prevCounters => prevCounters.map(counter => {
          if (counter.id === selectedCounterId) {
            return {
              ...counter,
              contractionLogs: counter.contractionLogs?.filter(log => log.id !== logId)
            };
          }
          return counter;
        }));
      }
      
      api.success({
        message: 'Success',
        description: 'Contraction log deleted successfully!',
      });
    } catch (err: any) {
      console.error('Error deleting contraction log:', err);
      api.error({
        message: 'Error',
        description: 'Failed to delete contraction log. Please try again.',
      });
    }
  };
  
  const showContractionLogs = (counterId: string) => {
    setSelectedCounterId(counterId);
    fetchLogsForCounter(counterId);
    setLogsModalVisible(true);
  };
  
  const handleLogsModalClose = () => {
    setLogsModalVisible(false);
    setSelectedCounterId(null);
    setSelectedLogs([]);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const calculateDuration = (counter: ContractionCounterData) => {
    const start = new Date(counter.createdAt).getTime();
    const end = counter.status === 'closed' ? 
      new Date(counter.updatedAt).getTime() : Date.now();
    const durationMs = end - start;
    
    // Convert to minutes
    const minutes = Math.floor(durationMs / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };
  
  const calculateActiveContractionTime = () => {
    if (!activeContraction) return { text: '0s', seconds: 0 };
    
    const start = new Date(activeContraction.startedAt).getTime();
    const now = Date.now();
    const durationMs = now - start;
    
    // Convert to seconds
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return { text: `${seconds}s`, seconds };
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return { text: `${minutes}m ${remainingSeconds}s`, seconds };
    }
  };
  
  const formatDurationSeconds = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };
  
  // Calculate time between contractions (interval)
  const calculateInterval = (logs: ContractionLogData[], index: number) => {
    if (index === 0 || !logs[index - 1]) {
      return "First contraction";
    }
    
    const currentStartTime = new Date(logs[index].startedAt).getTime();
    const previousEndTime = new Date(logs[index - 1].endedAt).getTime();
    const intervalMs = currentStartTime - previousEndTime;
    const intervalSeconds = Math.floor(intervalMs / 1000);
    
    return formatDurationSeconds(intervalSeconds);
  };
  
  // Table columns for contraction logs
  const logColumns = [
    {
      title: '#',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 50,
    },
    {
      title: 'Start Time',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (text: string) => formatTime(text),
    },
    {
      title: 'End Time',
      dataIndex: 'endedAt',
      key: 'endedAt',
      render: (text: string) => formatTime(text),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (seconds: number) => formatDurationSeconds(seconds),
      sorter: (a: ContractionLogData, b: ContractionLogData) => a.duration - b.duration,
    },
    {
      title: 'Interval',
      key: 'interval',
      render: (_: any, record: ContractionLogData, index: number) => 
        calculateInterval(selectedLogs, index),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: ContractionLogData) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => deleteContractionLog(record.id)}
        />
      ),
    }
  ];
  
  // Calculate statistics for logs
  const getLogStatistics = (logs: ContractionLogData[]) => {
    if (!logs || logs.length === 0) return null;
    
    const totalLogs = logs.length;
    const averageDuration = Math.round(logs.reduce((sum, log) => sum + log.duration, 0) / totalLogs);
    
    // Calculate average interval between contractions
    let totalIntervals = 0;
    let intervalSum = 0;
    for (let i = 1; i < logs.length; i++) {
      const currentStartTime = new Date(logs[i].startedAt).getTime();
      const previousEndTime = new Date(logs[i - 1].endedAt).getTime();
      intervalSum += (currentStartTime - previousEndTime);
      totalIntervals++;
    }
    
    const averageIntervalSeconds = totalIntervals > 0 ? 
      Math.round(intervalSum / totalIntervals / 1000) : 0;
    
    return {
      totalLogs,
      averageDuration,
      averageIntervalSeconds
    };
  };
  
  return (
    <div className="contraction-counter-page">
      {contextHolder}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Contraction Counter</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={createNewCounter}
          >
            New Session
          </Button>
        </Space>
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
          <Spin size="large" />
        </div>
      ) : counters.length === 0 ? (
        <Card>
          <Empty 
            description="No contraction counter sessions found. Create a new session to start tracking."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={createNewCounter}>
              Create New Session
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {counters.map((counter) => {
            const isActive = counter.status === 'active';
            const hasActiveContraction = activeContraction && activeContraction.counterId === counter.id;
            const { text: contractionTime, seconds: contractionSeconds } = calculateActiveContractionTime();
            const logCount = counter.contractionLogs?.length || 0;
            
            return (
              <Col xs={24} md={12} key={counter.id}>
                <Badge.Ribbon 
                  text={hasActiveContraction ? `Ongoing: ${contractionTime}` : undefined} 
                  color={hasActiveContraction ? 'red' : 'transparent'}
                  style={{
                    display: hasActiveContraction ? 'block' : 'none',
                    animation: hasActiveContraction ? 'pulse 1.5s infinite' : 'none'
                  }}
                >
                  <Card 
                    title={
                      <Space>
                        Session
                        {isActive && <Tag color="processing">(Active)</Tag>}
                        {!isActive && <Tag color="default">(Closed)</Tag>}
                      </Space>
                    }
                    style={{ 
                      height: '100%',
                      border: isActive ? 
                        hasActiveContraction ? '2px solid #f5222d' : '2px solid #1890ff' 
                        : undefined
                    }}
                    extra={
                      <Space>
                        <Button 
                          type="link" 
                          icon={<HistoryOutlined />} 
                          onClick={() => showContractionLogs(counter.id)}
                          disabled={logCount === 0}
                        >
                          View Logs
                          {logCount > 0 && ` (${logCount})`}
                        </Button>
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => deleteCounter(counter.id)}
                        />
                      </Space>
                    }
                  >
                    {hasActiveContraction && (
                      <Progress 
                        percent={Math.min(100, Math.round(contractionSeconds / 60 * 100))} 
                        status="active" 
                        showInfo={false}
                        strokeColor={{ 
                          '0%': '#108ee9',
                          '100%': '#f5222d',
                        }}
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    <div>
                      <Text type="secondary">Created: {formatDate(counter.createdAt)}</Text>
                      <br />
                      {counter.status === 'closed' && (
                        <>
                          <Text type="secondary">Closed: {formatDate(counter.updatedAt)}</Text>
                          <br />
                        </>
                      )}
                      <Text type="secondary">
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        Duration: {calculateDuration(counter)}
                      </Text>
                      <br />
                      <Text type="secondary">
                        <HistoryOutlined style={{ marginRight: 8 }} />
                        Contractions Logged: {logCount}
                      </Text>
                    </div>
                    
                    {isActive && (
                      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        {hasActiveContraction ? (
                          <Button 
                            danger
                            block
                            onClick={() => endContraction(counter.id)}
                          >
                            End Contraction
                          </Button>
                        ) : (
                          <Button 
                            type="primary"
                            block
                            onClick={() => startContraction(counter.id)}
                          >
                            Start Contraction
                          </Button>
                        )}
                        <Button 
                          danger
                          ghost
                          block
                          onClick={() => closeCounter(counter.id)}
                        >
                          Close Session
                        </Button>
                      </div>
                    )}
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}
      
      {/* Contraction Logs Modal */}
      <Modal
        title="Contraction Logs"
        open={logsModalVisible}
        onCancel={handleLogsModalClose}
        width={800}
        footer={[
          <Button key="close" onClick={handleLogsModalClose}>
            Close
          </Button>
        ]}
      >
        {logsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : selectedLogs.length === 0 ? (
          <Empty description="No contraction logs found for this session" />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              {selectedLogs.length > 0 && (
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Total Contractions"
                      value={selectedLogs.length}
                    />
                  </Col>
                  {selectedLogs.length > 1 && (
                    <>
                      <Col span={8}>
                        <Statistic
                          title="Average Duration"
                          value={formatDurationSeconds(Math.round(
                            selectedLogs.reduce((sum, log) => sum + log.duration, 0) / selectedLogs.length
                          ))}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Average Interval"
                          value={(() => {
                            const stats = getLogStatistics(selectedLogs);
                            return stats ? formatDurationSeconds(stats.averageIntervalSeconds) : 'N/A';
                          })()}
                        />
                      </Col>
                    </>
                  )}
                </Row>
              )}
            </div>
            <Table 
              columns={logColumns} 
              dataSource={selectedLogs} 
              rowKey="id"
              pagination={false}
              size="middle"
              scroll={{ y: 400 }}
            />
          </>
        )}
      </Modal>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ContractionCounter; 