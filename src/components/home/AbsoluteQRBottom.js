import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { navigate } from '../../utils/NavigationUtil'
import Icon from '../global/Icon'
import { bottomTabStyles } from '../../styles/bottomTabStyle'
import QRScannerModal from '../modals/QRScannerModal'

const AbsoluteQRBottom = () => {
    const [isVisible,setVisible]=useState(false)
  return (
   <>
    <View style={bottomTabStyles.container}>

        <TouchableOpacity onPress={()=>navigate('ReceivedFileScreen')}>
            <Icon
                name='apps-sharp'
                iconFamily='Ionicons'
                color='#333'
                size={24}
            />
        </TouchableOpacity>
        
        <TouchableOpacity 
        style={bottomTabStyles.qrCode}
        onPress={()=>setVisible(true)}
        
        >
            <Icon
                name='qrcode-scan'
                iconFamily='MaterialCommunityIcons'
                color='#fff'
                size={26}
            />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={()=>navigate('ReceivedFileScreen')}>
            <Icon
                name='beer-sharp'
                iconFamily='Ionicons'
                color='#333'
                size={24}
            />
        </TouchableOpacity>
        {
            isVisible&&(
                <QRScannerModal visible={isVisible} onClose={()=>setVisible(false)}/>
            )
        }


    </View>
   </>
  )
}

export default AbsoluteQRBottom

const styles = StyleSheet.create({})