import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { screenHeight } from '../../utils/Constants'
import { navigate } from '../../utils/NavigationUtil'

const SendReceiveButton = () => {
  return (
    <View style={styles.container}>
        <TouchableOpacity
        onPress={()=>navigate('SendScreen')}
            style={styles.button}
        >
            <Image 
            source={require("../../assets/icons/send.jpg")}
            style={styles.img}
            />
           
        </TouchableOpacity>
        <TouchableOpacity
        onPress={()=>navigate('ReceiveScreen')}
            style={styles.button}
        >
            <Image 
            style={styles.img}
            source={require("../../assets/icons/receive.jpg")}
            />
           
        </TouchableOpacity>
    </View>
  )
}

export default SendReceiveButton
 const styles = StyleSheet.create({
    container:{
        marginTop:screenHeight*0.04,
        flexDirection:'row',
        justifyContent:'space-evenly'
    },
    img:{
        width:"100%",
        height:'100%',
        resizeMode:'cover'
    },
    button:{
        width:140,
        height:100,
        borderRadius:10,
        overflow:'hidden'
    }
 })