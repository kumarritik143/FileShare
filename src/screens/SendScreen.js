import {View, Text, TouchableOpacity, Easing, Platform} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useTCP} from '../service/TCPProvider';
import LinearGradient from 'react-native-linear-gradient';
import {sendStyles} from '../styles/sendStyles';
import {SafeAreaView} from 'react-native-safe-area-context';
import QRScannerModal from '../components/modals/QRScannerModal';
import Icon from '../components/global/Icon';
import CustomText from '../components/global/CustomText';
import BreakerText from '../components/ui/BreakerText';
import {Colors, screenWidth} from '../utils/Constants';
import LottieView from 'lottie-react-native';
import {Image} from 'react-native';
import {Animated} from 'react-native';
import {goBack, navigate} from '../utils/NavigationUtil';
import dgram from 'react-native-udp';
const deviceNames = [
  'Oppo ',
  'Vivo ',
  'Samsung ',
  'Redmi ',
  'Apple ',
  
];

const SendScreen = () => {
  const {connectToServer, isConnected} = useTCP();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);

  const handleScan = (data) => {
    const [connectionData, deviceName] = data.replace('tcp://', '').split('|');
    const [host, port] = connectionData.split(':');
    connectToServer(host, parseInt(port, 10), deviceName);
  };

  const handleGoBack = () => {
    goBack();
  };
  const listenForDevices = async () => {
    const server = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });
    const port = 57143;
    
    server.bind(port, () => {
      console.log('Listening for nearby devices on port', port);
      
      // Enable broadcast on iOS
      if (Platform.OS === 'ios') {
        server.setBroadcast(true);
      }
    });

    server.on('message', (msg, info) => {
      console.log('Received UDP message from:', info.address);
      
      if(!msg){
        return;
      }

      try {
        const messageStr = msg.toString();
        
        // Check if message starts with tcp://
        if (!messageStr.startsWith('tcp://')) {
          return;
        }
        
        const [connectionData, otherDevice] = messageStr
          .replace('tcp://', '')
          .split('|');

        if (!connectionData || !otherDevice) {
          return;
        }

        console.log("Device discovered:", otherDevice);
        setNearbyDevices((prevDevices)=>{
          const deviceExists = prevDevices?.some(device => device?.name === otherDevice);
          
          if(!deviceExists){
            const newDevice = {
              id: `${Date.now()}_${Math.random()}`,
              name: otherDevice,
              image: require('../assets/icons/device.jpeg'),
              fullAddress: messageStr,
              position: getRandomPosition(150, prevDevices?.map((d) => d.position), 50),
              scale: new Animated.Value(0)
            };
            
            Animated.timing(newDevice.scale, {
              toValue: 1,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true
            }).start();
            
            return [...prevDevices, newDevice];
          }
          return prevDevices;
        });
      } catch (error) {
        console.log("Error processing UDP message:", error);
      }
    });

    server.on('error', (err) => {
      console.log('UDP Server error:', err);
    });

    return server;
  };

  const getRandomPosition=(radius,exisitingPositions,minDistance)=>{
    let position;
    let isOverlapping;
    do{
      const angle= Math.random()*360;
      const distance = Math.random()*(radius-50)+50;
      const x = distance*Math.cos((angle+Math.PI)/180);
      const y= distance*Math.sin((angle+Math.PI)/180);

      position ={x,y};
      isOverlapping= exisitingPositions?.some(pos=>{
        const dx= pos.x-position.x;
        const dy= pos.y-position.y;
        return Math.sqrt(dx*dx +dy*dy)<minDistance;
      }) || false;
    }while(isOverlapping)
    return position;
  }



  useEffect(() => {
    if (isConnected) {
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  useEffect(() => {
    let udpServer;
    const setupServer = async () => {
      console.log("Setting up UDP server for device discovery...");
      udpServer = await listenForDevices();
    };
    setupServer();

    return () => {
      if (udpServer) {
        udpServer.close(() => {
          console.log('UDP server is closed');
        });
      }
      setNearbyDevices([]);
    };
  }, []);


  // useEffect(()=>{
  //   const timer= setInterval(()=>{
  //     if(nearbyDevices.length<deviceNames.length){
  //       const newDevice={
  //         id:`${nearbyDevices.length+1}`,
  //         name:deviceNames[nearbyDevices.length],
  //         image:require('../assets/icons/device.jpeg'),
  //         position:getRandomPosition(150,nearbyDevices.map(d=>d.position),50),
  //         scale: new Animated.Value(0),
  //       };
  //       setNearbyDevices(prevDevices=>[...prevDevices,newDevice]);
  //       Animated.timing(newDevice.scale,{
  //         toValue:1,
  //         duration:500,
  //         easing:Easing.out(Easing.ease),
  //         useNativeDriver:true
  //       }).start();
  //     }
  //     else{
  //       clearInterval(timer)
  //     }
  //   },2000);
  //   return ()=>clearInterval(timer);
  // },[nearbyDevices])



  return (
    <LinearGradient
      colors={['#FFFFFF', '#B689ED', '#A066E5']}
      style={sendStyles.container}
      start={{x: 0, y: 1}}
      end={{x: 0, y: 0}}>
      <SafeAreaView />
      <View style={sendStyles.mainContainer}>
        <View style={sendStyles.infoContainer}>
          <Icon name="search" iconFamily="Ionicons" color="#fff" size={40} />

          <CustomText
            fontFamily="Okra-Bold"
            color="#fff"
            fontSize={16}
            style={{marginTop: 20}}>
            Looking for nearby Devices
          </CustomText>
          <CustomText
            fontFamily="Okra-Medium"
            color="#fff"
            fontSize={12}
            style={{textAlign: 'center'}}>
            Ensure your device's hotspot is active and receiver device is
            connected to it.
          </CustomText>
          <View>
            <BreakerText text="or" />
          </View>

                     <TouchableOpacity
             style={sendStyles.qrButton}
             onPress={() => setIsScannerVisible(true)}>
             <Icon
               name="qrcode-scan"
               iconFamily="MaterialCommunityIcons"
               color={Colors.primary}
               size={16}
             />
             <CustomText fontFamily="Okra-Bold" color={Colors.primary}>
               Scan QR
             </CustomText>
           </TouchableOpacity>
        </View>

        <View style={sendStyles.animationContainer}>
          <View style={sendStyles.lottieContainer}>
            <LottieView
              style={sendStyles.lottie}
              source={require('../assets/animations/scanner.json')}
              autoPlay
              loop={true}
              hardwareAccelerationAndroid
            />
            {nearbyDevices?.map(device => (
              <Animated.View
                key={device?.id}
                style={[
                  sendStyles.deviceDot,
                  {
                    transform: [{scale: device.scale}],
                    left: screenWidth / 2.33 + device.position?.x,
                    top: screenWidth / 2.2 + device.position?.y,
                  },
                ]}>
                <TouchableOpacity
                  style={sendStyles.popup}
                  onPress={() => handleScan(device?.fullAddress)}>
                  <Image source={device.image} style={sendStyles.deviceImage} />
                  <CustomText
                    numberOfLines={1}
                    color="#333"
                    fontFamily="Okra-Bold"
                    fontSize={8}
                    style={sendStyles.deviceText}>
                    {device.name}
                  </CustomText>
                </TouchableOpacity>
              </Animated.View>
            ))}
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
            color="#000"
            size={16}
          />
        </TouchableOpacity>
      </View>
      {isScannerVisible && (
        <QRScannerModal
          visible={isScannerVisible}
          onClose={() => setIsScannerVisible(false)}
        />
      )}
    </LinearGradient>
  );
};

export default SendScreen;
