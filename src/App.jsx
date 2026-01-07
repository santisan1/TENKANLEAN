import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { Package, AlertTriangle, CheckCircle, Truck, Camera, Clock, MapPin, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMHgf9gtc9NZbJXxODxVWfB17Y81geUfo",
  authDomain: "tte-tenkan-lean.firebaseapp.com",
  projectId: "tte-tenkan-lean",
  storageBucket: "tte-tenkan-lean.firebasestorage.app",
  messagingSenderId: "379567823994",
  appId: "1:379567823994:web:e34423c78c1a1ecff3afc3",
  measurementId: "G-6VM1K3P7KK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Utility: Check if order is urgent (>15 min pending)
const isUrgent = (timestamp, status) => {
  if (status !== 'PENDING' || !timestamp) return false;
  const now = Date.now();
  const orderTime = timestamp.toDate().getTime();
  return (now - orderTime) > 15 * 60 * 1000;
};

// Utility: Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '--:--';
  return timestamp.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

// Component: Operator View (Mobile)
const OperatorView = () => {
  const [cardId, setCardId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const simulateScan = () => {
    const mockId = `MAT-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`;
    setCardId(mockId);
    handleScan(mockId);
  };

  const handleScan = async (scannedId) => {
    setScanning(true);
    setFeedback(null);

    try {
      const cardRef = doc(db, 'kanban_cards', scannedId);
      const cardSnap = await getDoc(cardRef);

      if (!cardSnap.exists()) {
        setFeedback({ type: 'error', message: 'Tarjeta no encontrada en el sistema' });
        setScanning(false);
        return;
      }

      const card = cardSnap.data();

      await addDoc(collection(db, 'active_orders'), {
        cardId: scannedId,
        partNumber: card.partNumber,
        description: card.description,
        location: card.location,
        standardPack: card.standardPack,
        timestamp: serverTimestamp(),
        status: 'PENDING',
        createdAt: serverTimestamp()
      });

      setFeedback({
        type: 'success',
        message: `Pedido enviado a Almacén\n${card.partNumber} - ${card.description}`
      });

      setTimeout(() => {
        setFeedback(null);
        setCardId('');
      }, 3000);

    } catch (error) {
      console.error('Error:', error);
      setFeedback({ type: 'error', message: 'Error al procesar el pedido' });
    }

    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-2xl mb-4">
            <Package className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">E-Kanban TTE</h1>
          <p className="text-gray-400">Punto de Consumo - Bobinado</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 shadow-2xl"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID de Tarjeta Kanban
            </label>
            <input
              type="text"
              value={cardId}
              onChange={(e) => setCardId(e.target.value.toUpperCase())}
              placeholder="MAT-001"
              className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={scanning}
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleScan(cardId)}
              disabled={!cardId || scanning}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmar Pedido
                </>
              )}
            </button>

            <button
              onClick={simulateScan}
              disabled={scanning}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Simular Escaneo QR
            </button>
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${feedback.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
                  }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${feedback.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {feedback.type === 'success' ? '¡Pedido Enviado!' : 'Error'}
                  </p>
                  <p className="text-sm text-gray-300 whitespace-pre-line">{feedback.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// Component: Supply Chain Dashboard
const SupplyChainView = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, inTransit: 0, delivered: 0 });

  useEffect(() => {
    const q = query(
      collection(db, 'active_orders'),
      where('status', 'in', ['PENDING', 'IN_TRANSIT']),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      const pending = ordersData.filter(o => o.status === 'PENDING').length;
      const inTransit = ordersData.filter(o => o.status === 'IN_TRANSIT').length;
      setStats({ pending, inTransit, delivered: 0 });
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'active_orders', orderId);
      const updateData = { status: newStatus };

      if (newStatus === 'DELIVERED') {
        updateData.deliveredAt = serverTimestamp();
      } else if (newStatus === 'IN_TRANSIT') {
        updateData.dispatchedAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Calculate location statuses for map
  const locationStatuses = orders.reduce((acc, order) => {
    if (!acc[order.location]) {
      acc[order.location] = { pending: false, inTransit: false };
    }
    if (order.status === 'PENDING') acc[order.location].pending = true;
    if (order.status === 'IN_TRANSIT') acc[order.location].inTransit = true;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard de Almacén</h1>
                <p className="text-blue-200 text-sm">Sistema E-Kanban - Supply Chain TTE</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString('es-AR')}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            label="Pedidos Pendientes"
            value={stats.pending}
            color="red"
            bgColor="bg-red-50"
            iconColor="bg-red-500"
            textColor="text-red-700"
          />
          <StatCard
            icon={<Truck className="w-6 h-6" />}
            label="En Tránsito"
            value={stats.inTransit}
            color="yellow"
            bgColor="bg-yellow-50"
            iconColor="bg-yellow-500"
            textColor="text-yellow-700"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            label="Completados Hoy"
            value={stats.delivered}
            color="green"
            bgColor="bg-green-50"
            iconColor="bg-green-500"
            textColor="text-green-700"
          />
        </div>

        {/* Plant Map */}
        <PlantMap locationStatuses={locationStatuses} />

        {/* Orders Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <OrderColumn
            title="Pedidos Pendientes"
            status="PENDING"
            orders={orders.filter(o => o.status === 'PENDING')}
            onAction={(id) => handleStatusChange(id, 'IN_TRANSIT')}
            actionLabel="Despachar"
            actionIcon={<Truck className="w-4 h-4" />}
          />

          <OrderColumn
            title="En Tránsito"
            status="IN_TRANSIT"
            orders={orders.filter(o => o.status === 'IN_TRANSIT')}
            onAction={(id) => handleStatusChange(id, 'DELIVERED')}
            actionLabel="Entregar"
            actionIcon={<CheckCircle className="w-4 h-4" />}
          />
        </div>
      </div>
    </div>
  );
};

// Component: Plant Map
const PlantMap = ({ locationStatuses }) => {
  const locations = [
    { id: 'Bobinado A', x: 20, y: 30 },
    { id: 'Bobinado B', x: 50, y: 30 },
    { id: 'Bobinado C', x: 80, y: 30 },
    { id: 'Bobinado D', x: 35, y: 70 },
    { id: 'Bobinado E', x: 65, y: 70 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Mapa de Planta - Bobinado</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">En Tránsito</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-gray-600">Normal</span>
          </div>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 h-80 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Location Points */}
        {locations.map(location => {
          const status = locationStatuses[location.id];
          let color = 'bg-gray-300';
          let shouldPulse = false;

          if (status?.pending) {
            color = 'bg-red-500';
            shouldPulse = true;
          } else if (status?.inTransit) {
            color = 'bg-yellow-500';
            shouldPulse = true;
          }

          return (
            <motion.div
              key={location.id}
              className="absolute"
              style={{ left: `${location.x}%`, top: `${location.y}%` }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                {shouldPulse && (
                  <motion.div
                    className={`absolute inset-0 ${color} rounded-full opacity-75`}
                    animate={{ scale: [1, 2, 2], opacity: [0.75, 0, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className={`w-4 h-4 ${color} rounded-full border-2 border-white shadow-lg`} />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900">{location.id}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Component: Stat Card
const StatCard = ({ icon, label, value, bgColor, iconColor, textColor }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow-sm p-6 border border-gray-200`}>
      <div className={`inline-flex items-center justify-center w-12 h-12 ${iconColor} rounded-lg mb-3 text-white`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
};

// Component: Order Column
const OrderColumn = ({ title, status, orders, onAction, actionLabel, actionIcon }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        {title}
        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {orders.length}
        </span>
      </h2>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={onAction}
              actionLabel={actionLabel}
              actionIcon={actionIcon}
            />
          ))}
        </AnimatePresence>

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay pedidos {status === 'PENDING' ? 'pendientes' : 'en tránsito'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Component: Order Card
const OrderCard = ({ order, onAction, actionLabel, actionIcon }) => {
  const urgent = isUrgent(order.timestamp, order.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-gray-50 rounded-lg p-4 border-2 ${urgent ? 'border-red-400' : 'border-gray-200'} hover:shadow-md transition-shadow`}
    >
      {urgent && (
        <motion.div
          className="flex items-center gap-2 text-red-600 text-sm font-semibold mb-2 bg-red-50 px-2 py-1 rounded"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <AlertTriangle className="w-4 h-4" />
          ¡URGENTE! +15 min
        </motion.div>
      )}

      <div className="mb-3">
        <p className="font-bold text-gray-900 text-lg">{order.partNumber}</p>
        <p className="text-sm text-gray-600">{order.description}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 bg-white px-3 py-2 rounded">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {order.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(order.timestamp)}
        </span>
      </div>

      <button
        onClick={() => onAction(order.id)}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        {actionIcon}
        {actionLabel}
      </button>
    </motion.div>
  );
};

// Main App
export default function App() {
  const [isMobile] = useState(window.innerWidth < 768);

  return isMobile ? <OperatorView /> : <SupplyChainView />;
}