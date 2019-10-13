import React from 'react';
import { Image, Platform } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import {Ionicons} from '@expo/vector-icons';
import Header from 'react-native-elements';

import HomeScreen from './screens/HomeScreen';
import ListScreen from './screens/ListScreen';

const HomeStack = createStackNavigator({Home: HomeScreen});
  
const ListStack = createStackNavigator({List: ListScreen});

export default createAppContainer(createBottomTabNavigator(
    {
      List: {screen: ListStack},
      Home: {screen: HomeStack}
    },
    {
      navigationOptions: ({ navigation }) => ({
        tabBarIcon: ({ focused, tintColor }) => {
          const { routeName } = navigation.state;
          let iconName;
          if (routeName === 'Home') {
            iconName = 'ios-camera';
          } 
          else if(routeName==='List'){
            iconName = 'ios-list-box';
          }
  
          // You can return any component that you like here! We usually use an
          // icon component from react-native-vector-icons
          return <Ionicons name={iconName} size={27} color={tintColor} />;
        }
      }),
      tabBarOptions: {
        activeTintColor: '#99cfe0',
        inactiveTintColor: 'gray',
        showLabel:false,
      },
    }
  ));
  