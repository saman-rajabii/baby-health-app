import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Card, 
  Row, 
  Col,
  Spin,
  Divider,
  Alert,
  Space,
  Empty,
  Tag,
  notification,
  Modal,
  Form,
  InputNumber,
  Select,
  Progress,
  Statistic,
  Table
} from 'antd';
import { PlusOutlined, HeartOutlined, ClockCircleOutlined, FieldTimeOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import { kickCounterService } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Countdown } = Statistic;

interface KickCounterData {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  kickCount: number;
  period: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  kickLogs?: KickLogData[];
}

interface KickLogData {
  id: string;
  counterId: string;
  happenedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface NewSessionFormValues {
  period: number;
}

interface CounterTimerState {
  [key: string]: {
    elapsed: number;
    percentage: number;
    remainingMs: number;
  }
}

const KickCounter: React.FC = () => {
  const [counters, setCounters] = useState<KickCounterData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [api, contextHolder] = notification.useNotification();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm<NewSessionFormValues>();
  const [timerState, setTimerState] = useState<CounterTimerState>({});
  const [tick, setTick] = useState(0);
  
  // New state for logs modal
  const [logsModalVisible, setLogsModalVisible] = useState<boolean>(false);
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<KickLogData[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  
  const fetchCounters = async () => {
    try {
      setLoading(true);
      const data = await kickCounterService.getAllCounters();
      setCounters(data);
    } catch (err: any) {
      console.error('Error fetching kick counters:', err);
      api.error({
        message: 'Error',
        description: 'Failed to load kick counters. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update timer for all active sessions
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate elapsed time and remaining time for each counter
  useEffect(() => {
    const newTimerState: CounterTimerState = {};
    
    counters.forEach(counter => {
      if (counter.isActive) {
        const startTime = new Date(counter.startedAt).getTime();
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
        const periodMs = counter.period * 60 * 60 * 1000;
        const remainingMs = Math.max(0, periodMs - elapsedMs);
        const percentage = Math.min(100, (elapsedMs / periodMs) * 100);
        
        newTimerState[counter.id] = {
          elapsed: elapsedMinutes,
          percentage: percentage,
          remainingMs: remainingMs
        };
      }
    });
    
    setTimerState(newTimerState);
  }, [counters, tick]);
  
  useEffect(() => {
    fetchCounters();
  }, []);
  
  const showNewSessionModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };
  
  const handleModalCancel = () => {
    setIsModalVisible(false);
  };
  
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      await createNewCounter(values.period);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };
  
  const createNewCounter = async (period: number) => {
    try {
      // Create new counter with period
      const data = await kickCounterService.createCounter(period);
      
      // Ensure the new counter has expected properties
      const newCounter: KickCounterData = {
        ...data,
        finishedAt: null, // Ensure finishedAt is null for new counter
        isActive: true,   // New counter should always be active
        kickCount: 0,     // Initialize kick count to 0
        period: period,   // Use the period from form
      };
      
      setCounters([newCounter, ...counters]);
      api.success({
        message: 'Success',
        description: 'New kick counter session created successfully!',
      });
    } catch (err: any) {
      console.error('Error creating kick counter:', err);
      api.error({
        message: 'Error',
        description: 'Failed to create new kick counter. Please try again.',
      });
    }
  };
  
  const recordKick = async (counterId: string) => {
    try {
      // Check if we're still within the time period
      const counterTimer = timerState[counterId];
      if (counterTimer && counterTimer.remainingMs <= 0) {
        api.warning({
          message: 'Time period ended',
          description: 'The time period for this session has ended. You can finish the session now.',
        });
        return;
      }
      
      // Use createKickLog instead of recordKick to capture the exact time
      const happenedAt = new Date().toISOString();
      await kickCounterService.createKickLog(counterId, happenedAt);
      
      // Update the UI immediately for better UX
      setCounters(prevCounters => 
        prevCounters.map(counter => 
          counter.id === counterId 
            ? { ...counter, kickCount: counter.kickCount + 1 } 
            : counter
        )
      );
      
      api.success({
        message: 'Success',
        description: 'Kick recorded successfully!',
      });
    } catch (err: any) {
      console.error('Error recording kick:', err);
      api.error({
        message: 'Error',
        description: 'Failed to record kick. Please try again.',
      });
    }
  };
  
  const finishCounter = async (counterId: string) => {
    try {
      const updatedCounter = await kickCounterService.finishCounter(counterId);
      
      // Update the UI immediately
      setCounters(prevCounters => 
        prevCounters.map(counter => 
          counter.id === counterId ? updatedCounter : counter
        )
      );
      
      api.success({
        message: 'Success',
        description: 'Kick counter session finished successfully!',
      });
    } catch (err: any) {
      console.error('Error finishing kick counter:', err);
      api.error({
        message: 'Error',
        description: 'Failed to finish kick counter. Please try again.',
      });
    }
  };
  
  // Add function to delete a counter
  const deleteCounter = async (counterId: string) => {
    try {
      await kickCounterService.deleteCounter(counterId);
      
      // Remove the counter from local state
      setCounters(prevCounters => prevCounters.filter(counter => counter.id !== counterId));
      
      api.success({
        message: 'Success',
        description: 'Kick counter session deleted successfully!',
      });
    } catch (err: any) {
      console.error('Error deleting kick counter:', err);
      api.error({
        message: 'Error',
        description: 'Failed to delete kick counter. Please try again.',
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
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
  
  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Add function to fetch logs for a counter
  const fetchLogsForCounter = async (counterId: string) => {
    try {
      setLogsLoading(true);
      // Use the new API method to get logs
      const logs = await kickCounterService.getLogsByCounter(counterId);
      setSelectedLogs(logs);
    } catch (err: any) {
      console.error('Error fetching kick logs:', err);
      api.error({
        message: 'Error',
        description: 'Failed to load kick logs. Please try again.',
      });
    } finally {
      setLogsLoading(false);
    }
  };
  
  // Add function to show logs modal
  const showKickLogs = (counterId: string) => {
    setSelectedCounterId(counterId);
    fetchLogsForCounter(counterId);
    setLogsModalVisible(true);
  };
  
  // Add function to handle modal close
  const handleLogsModalClose = () => {
    setLogsModalVisible(false);
    setSelectedCounterId(null);
    setSelectedLogs([]);
  };
  
  // Add columns for logs table
  const logColumns = [
    {
      title: '#',
      key: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 50,
    },
    {
      title: 'Time',
      dataIndex: 'happenedAt',
      key: 'happenedAt',
      render: (text: string) => formatTime(text),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: KickLogData) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => deleteKickLog(record.id)}
        />
      ),
    }
  ];
  
  // Add function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // Add function to delete a kick log
  const deleteKickLog = async (logId: string) => {
    try {
      // Use the new API method to delete the log
      await kickCounterService.deleteLog(logId);
      
      // Update local state
      if (selectedCounterId) {
        setSelectedLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        
        // Also update the main counters state
        setCounters(prevCounters => prevCounters.map(counter => {
          if (counter.id === selectedCounterId && counter.kickLogs) {
            return {
              ...counter,
              kickLogs: counter.kickLogs.filter(log => log.id !== logId),
              kickCount: counter.kickCount > 0 ? counter.kickCount - 1 : 0
            };
          }
          return counter;
        }));
      }
      
      api.success({
        message: 'Success',
        description: 'Kick log deleted successfully!',
      });
    } catch (err: any) {
      console.error('Error deleting kick log:', err);
      api.error({
        message: 'Error',
        description: 'Failed to delete kick log. Please try again.',
      });
    }
  };
  
  return (
    <div className="kick-counter-page">
      {contextHolder}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Kick Counter</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={showNewSessionModal}
        >
          New Session
        </Button>
      </div>
      
      {/* New Session Modal */}
      <Modal
        title="Create New Kick Counter Session"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Create"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ period: 2 }}
        >
          <Form.Item
            name="period"
            label="Time Period (in hours)"
            rules={[
              { required: true, message: 'Please select a time period' },
            ]}
            tooltip="The time period over which to count kicks"
          >
            <InputNumber 
              min={1} 
              max={24} 
              style={{ width: '100%' }} 
              addonAfter="hours"
            />
          </Form.Item>
          <Text type="secondary">
            Recommended: Count kicks over a 2-hour period. Your healthcare provider may recommend a different interval.
          </Text>
        </Form>
      </Modal>
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
          <Spin size="large" />
        </div>
      ) : counters.length === 0 ? (
        <Card>
          <Empty 
            description="No kick counter sessions found. Create a new session to start counting."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={showNewSessionModal}>
              Create New Session
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {counters.map((counter) => {
            const isActive = !counter.finishedAt;
            const kickCount = counter.kickCount;
            
            return (
              <Col xs={24} md={12} key={counter.id}>
                <Card 
                  title={
                    <Space>
                      Session
                      {isActive && <Tag color="success">(Active)</Tag>}
                      {!isActive && <Tag color="default">(Completed)</Tag>}
                    </Space>
                  }
                  style={{ 
                    height: '100%',
                    border: isActive ? '2px solid #52c41a' : undefined
                  }}
                  extra={
                    <Space>
                      <Button 
                        type="link" 
                        icon={<HistoryOutlined />} 
                        onClick={() => showKickLogs(counter.id)}
                        disabled={kickCount === 0}
                      >
                        View Logs
                        {kickCount > 0 && ` (${kickCount})`}
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
                  <div>
                    <Text type="secondary">Started: {formatDate(counter.startedAt)}</Text>
                    <br />
                    {counter.finishedAt && (
                      <>
                        <Text type="secondary">Finished: {formatDate(counter.finishedAt)}</Text>
                        <br />
                      </>
                    )}
                    <Text type="secondary">Duration: {calculateDuration(counter.startedAt, counter.finishedAt)}</Text>
                    <br />
                    <Text type="secondary">
                      <ClockCircleOutlined style={{ marginRight: 8 }} />
                      Time Period: {counter.period} hour{counter.period !== 1 ? 's' : ''}
                    </Text>
                    <br />
                    <Text type="secondary">
                      <HeartOutlined style={{ marginRight: 8 }} />
                      Kicks Recorded: <span style={{ fontWeight: 'bold' }}>{kickCount || counter.kickLogs?.length}</span>
                    </Text>
                    
                    {isActive && timerState[counter.id] && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text>
                            <FieldTimeOutlined /> Timer:
                          </Text>
                          <Text strong style={{ fontSize: '16px' }}>
                            {formatTimeRemaining(timerState[counter.id].remainingMs)}
                          </Text>
                        </div>
                        <Progress 
                          percent={timerState[counter.id].percentage} 
                          status={timerState[counter.id].remainingMs > 0 ? "active" : "success"}
                          showInfo={false}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                          style={{ marginTop: 8 }}
                        />
                      </div>
                    )}
                    
                    <Divider />
                  </div>
                  
                  {isActive && (
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      <Button 
                        type="primary"
                        block
                        icon={<HeartOutlined />}
                        onClick={() => recordKick(counter.id)}
                        disabled={timerState[counter.id]?.remainingMs <= 0}
                      >
                        Record Kick
                      </Button>
                      <Button 
                        danger
                        block
                        onClick={() => finishCounter(counter.id)}
                      >
                        Finish Session
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      
      {/* Kick Logs Modal */}
      <Modal
        title="Kick Logs"
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
          <Empty description="No kick logs found for this session" />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text>
                Total Kicks: <strong>{selectedLogs.length}</strong>
              </Text>
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
    </div>
  );
};

export default KickCounter; 