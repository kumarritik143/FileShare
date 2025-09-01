import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import React, {FC, useEffect, useRef, useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {sendStyles} from '../styles/sendStyles';
import Icon from '../components/global/Icon';
import CustomText from '../components/global/CustomText';
import BreakerText from '../components/ui/BreakerText';
import {Colors} from '../utils/Constants';
import LottieView from 'lottie-react-native';
import QRGeneratorModal from '../components/modals/QRGeneratorModal';
import DeviceInfo from 'react-native-device-info';
import {goBack, navigate} from '../utils/NavigationUtil';
import {useTCP} from '../service/TCPProvider';
import {getBroadcastIPAddress, getLocalIPAddress} from '../utils/networkUtils';

import dgram from 'react-native-udp';

const ReceiveScreen = () => {
  const {startServer, server, isConnected} = useTCP();

  const [qrValue, setQRValue] = useState('');
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const intervalRef = useRef(null);

  const setupServer = async () => {
    const deviceName = await DeviceInfo.getDeviceName();
    const ip = await getLocalIPAddress();
    const port = 4000;

    console.log(`Setting up server with IP: ${ip}, Port: ${port}, Device: ${deviceName}`);

    if (!server) {
      startServer(port);
    }
    
    const qrString = `tcp://${ip}:${port}|${deviceName}`;
    setQRValue(qrString);
    console.log(`QR value set to: ${qrString}`);
  };

  const sendDiscoverySignal = async () => {
    if (!qrValue) {
      return;
    }
    
    const deviceName = await DeviceInfo.getDeviceName();
    const broadcastAddress = await getBroadcastIPAddress();
    const targetAddress = broadcastAddress || '255.255.255.255';
    const port = 57143;

    const client = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });

    client.bind(() => {
      try {
        if (Platform.OS === 'ios') {
          client.setBroadcast(true);
        }
        
        const message = `${qrValue}`;
        
        client.send(
          message,
          0,
          message.length,
          port,
          targetAddress,
          err => {
            if (err) {
              console.log('Error in sending discovery signal', err);
            }
            client.close();
          },
        );
      } catch (error) {
        console.error('Failed to set broadcast or send', error);
        client.close();
      }
    });
  };

  const handleGoBack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    goBack();
  };

  useEffect(() => {
    if (!qrValue) {
      return;
    }
    sendDiscoverySignal();
    intervalRef.current = setInterval(sendDiscoverySignal, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [qrValue]);

  useEffect(() => {
    if (isConnected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  useEffect(() => {
    setupServer();
  }, []);

  // Add UDP listening for device discovery
  useEffect(() => {
    const listenForDiscovery = async () => {
      const server = dgram.createSocket({
        type: 'udp4',
        reusePort: true,
      });
      const port = 57143;
      
      server.bind(port, () => {
        console.log('ReceiveScreen: Listening for discovery signals on port', port);
        
        if (Platform.OS === 'ios') {
          server.setBroadcast(true);
        }
      });

      server.on('message', (msg, info) => {
        console.log('ReceiveScreen: Received UDP message from:', info.address);
        console.log('ReceiveScreen: Message content:', msg.toString());
      });

      server.on('error', (err) => {
        console.log('ReceiveScreen: UDP Server error:', err);
      });

      return server;
    };

    let udpServer;
    const setupUDP = async () => {
      udpServer = await listenForDiscovery();
    };
    setupUDP();

    return () => {
      if (udpServer) {
        udpServer.close(() => {
          console.log('ReceiveScreen: UDP server closed');
        });
      }
    };
  }, []);

  return (
    <LinearGradient
      colors={['#ffffff', '#4DA0DE', '#3387C5']}
      style={sendStyles.container}
      start={{x: 0, y: 1}}
      end={{x: 0, y: 0}}>
      <SafeAreaView />

      <View style={sendStyles.mainContainer}>
        <View style={sendStyles.infoContainer}>
          <Icon
            name="blur-on"
            iconFamily="MaterialIcons"
            color="#fff"
            size={40}
          />

          <CustomText
            fontFamily="Okra-Bold"
            color="#fff"
            fontSize={16}
            style={{marginTop: 20}}>
            Receiving From nearby Devices
          </CustomText>
          <CustomText
            fontFamily="Okra-Medium"
            color="#fff"
            fontSize={12}
            style={{textAlign: 'center'}}>
            Ensure your device is connected to the sender's hotspot network.
          </CustomText>
          <View>
            <BreakerText text="or" />
          </View>

                                <TouchableOpacity
             style={sendStyles.qrButton}
             onPress={() => setIsScannerVisible(true)}>
             <Icon
               name="qrcode"
               iconFamily="MaterialCommunityIcons"
               color={Colors.primary}
               size={16}
             />
             <CustomText fontFamily="Okra-Bold" color={Colors.primary}>
               Show QR
             </CustomText>
           </TouchableOpacity>
        </View>
        <View style={sendStyles.animationContainer}>
          <View style={sendStyles.lottieContainer}>
            <LottieView
              style={sendStyles.lottie}
              source={require('../assets/animations/scan2.json')}
              autoPlay
              loop={true}
              hardwareAccelerationAndroid
            />
          </View>
          <Image
            source={require('../assets/images/profile.jpg')}
            style={sendStyles.profileImage}
          />
        </View>
        <TouchableOpacity onPress={handleGoBack} style={sendStyles.backButton}>
          <Icon
            name="arrow-back"
            iconFamily="Ionicons"
            size={16}
            color="#000"
          />
        </TouchableOpacity>
      </View>
      {isScannerVisible && (
        <QRGeneratorModal
          visible={isScannerVisible}
          onClose={() => setIsScannerVisible(false)}
        />
      )}
    </LinearGradient>
  );
};

export default ReceiveScreen;
