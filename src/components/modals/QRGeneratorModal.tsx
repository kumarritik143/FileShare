import { View, Text, Modal, ActivityIndicator, TouchableOpacity } from 'react-native'
import React, { FC, useEffect, useState } from 'react'
import { modalStyles } from '../../styles/modalStyles';
import Animated,{Easing,useSharedValue,useAnimatedStyle,withRepeat,withTiming} from 'react-native-reanimated'

import  LinearGradient  from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg'
import { multiColor } from '../../utils/Constants';
import CustomText from '../global/CustomText';
import Icon from '../global/Icon';
import { useTCP } from '../../service/TCPProvider';
import DeviceInfo from 'react-native-device-info';
import { getLocalIPAddress } from '../../utils/networkUtils';
import { navigate } from '../../utils/NavigationUtil';
interface ModalProps {
    visible: boolean;
    onClose: () => void;
}

const QRGeneratorModal: FC<ModalProps> = ({ visible, onClose }) => {
    const {startServer,server,isConnected}=useTCP();
    const [loading,setLoading]= useState(false);
    const [qrValue,setQRValue]=useState('Pawan');
    const shimmerTranslateX= useSharedValue(-300);
    const shimmerStyle= useAnimatedStyle(()=>({
        transform:[{translateX:shimmerTranslateX.value}]
    }))



    const setupServer = async () => {
        const deviceName = await DeviceInfo.getDeviceName();
        const ip = await getLocalIPAddress();
        const port = 4000;
    
        if (server) {
         
          setQRValue(`tcp://${ip}:${port}|${deviceName}`);
          setLoading(false);
    
          console.log(`server information on QR Generate Modal ${ip}:  ${port}`);
          return
        }
        startServer(port);
        setQRValue(`tcp://${ip}:${port}|${deviceName}`);
        console.log(`server information on QR Generate Modal ${ip}:  ${port}`);
        setLoading(false);
      };






    useEffect(()=>{
        shimmerTranslateX.value=withRepeat(
            withTiming(300,{duration:1500,easing:Easing.linear}),
            -1,
            false,
        )
        if(visible){
            setLoading(true);
            setupServer();
        }

    },[visible])


    useEffect(()=>{
        console.log('Tcp Provider : is connected updated to ',isConnected);
        if(isConnected){
            onClose();
            navigate('ConnectionScreen')
        }
    },[isConnected])
    
// console.log(loading+qrValue+visible)
  return (
        <Modal
        animationType='slide'
        visible={visible}
        presentationStyle='formSheet'
        onRequestClose={onClose}
        onDismiss={onClose}
        >
            
            <View style={modalStyles.modalContainer}>
                <View style={modalStyles.qrContainer}>
                    {
                       
                        loading || qrValue==null || qrValue==''?(
                            
                            <View style={modalStyles.skeleton}>
                                <Animated.View style={[modalStyles.shimmerOverlay,shimmerStyle]}>
                                    <LinearGradient
                                    colors={['#f3f3f3','#fff','#f3f3f3']}
                                    start={{x:0,y:0}}
                                    end={{x:1,y:0}}
                                    style={modalStyles.shimmerGradient}
                                    />
                                    
                                    
                                    

                                </Animated.View>
                            </View>
                        ):(<QRCode
                        value={qrValue}
                        size={250}
                        logoSize={60}
                        backgroundColor='#fff'
                        logoMargin={2}
                        logoBorderRadius={10}
                        logo={require('../../assets/images/profile.jpg')}
                        linearGradient={multiColor}
                        enableLinearGradient
                        />)
                    }
                </View>
                <View style={modalStyles.info}>

                    <CustomText style={modalStyles.infoText1}>
                        Ensure You're on the same WI-FI Network
                    </CustomText>
                    <CustomText
                    style={modalStyles.infoText2}
                    >
                        Ask the Sender to scan this QR code to connect and transfer File

                    </CustomText>
                </View>
                <ActivityIndicator size={'small'}
                color={"#000"}  
                style={{alignSelf:'center'}}/>

                <TouchableOpacity
                onPress={()=>onClose()}
                style={modalStyles.closeButton}
                >
                    <Icon name='close' iconFamily='Ionicons' size={24} color='#000'/>

                </TouchableOpacity>



            </View>

        </Modal>
  )
}

export default QRGeneratorModal;