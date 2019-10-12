import React from 'react';
import {
	ActivityIndicator,
	Button,
	Clipboard,
	FlatList,
	Image,
	Share,
	StyleSheet,
	Text,
	ScrollView,
	View
} from 'react-native';

export default class App extends React.Component {
  render() {
    return (
        <ScrollView style={styles.container}>
            <Text>stuff</Text>
        </ScrollView>

    );
  }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    }

});