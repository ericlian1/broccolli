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
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import uuid from 'uuid';
import Environment from '../config/environment';
import firebase from '../config/firebase';
import {ListItem} from 'react-native-elements';


import MainTabNavigator from './MainTabNavigator';
import React from 'react';


export default class App extends React.Component {
	state = {
		image: null,
		uploading: false,
		response: null
	};

	async componentDidMount() {
		await Permissions.askAsync(Permissions.CAMERA_ROLL);
		await Permissions.askAsync(Permissions.CAMERA);
	}

	render() {
		let { image } = this.state;

		return (
			<View style={styles.container}>
				<ScrollView
					style={styles.container}
					contentContainerStyle={styles.contentContainer}
				>
					<View style={styles.getStartedContainer}>
						{image ? null : (
							<Text style={styles.getStartedText}>Google Cloud Vision</Text>
						)}
					</View>

					<View style={styles.helpContainer}>
						<Button
							onPress={this._pickImage}
							title="Pick an image from camera roll"
						/>

						<Button onPress={this._takePhoto} title="Take a photo" />
						{this._maybeRenderImage()}
						{this._maybeRenderUploadingOverlay()}
					</View>
				</ScrollView>
			</View>
		);
	}

	organize = array => {
		return array.map(function(item, i) {
			return (
				<View key={i}>
					<Text>{item}</Text>
				</View>
			);
		});
	};

	_maybeRenderUploadingOverlay = () => {
		if (this.state.uploading) {
			return (
				<View
					style={[
						StyleSheet.absoluteFill,
						{
							backgroundColor: 'rgba(0,0,0,0.4)',
							alignItems: 'center',
							justifyContent: 'center'
						}
					]}
				>
					<ActivityIndicator color="#fff" animating size="large" />
				</View>
			);
		}
	};

	_maybeRenderImage = () => {
		let { image, googleResponse } = this.state;
		if (!image) {
			return;
		}

		return (
			<View
				style={{
					marginTop: 20,
					width: 250,
					borderRadius: 3,
					elevation: 2
				}}
			>
				<Button
					style={{ marginBottom: 10 }}
					onPress={() => this.submitToGoogle()}
					title="Analyze!"
				/>

				<View
					style={{
						borderTopRightRadius: 3,
						borderTopLeftRadius: 3,
						shadowColor: 'rgba(0,0,0,1)',
						shadowOpacity: 0.2,
						shadowOffset: { width: 4, height: 4 },
						shadowRadius: 5,
						overflow: 'hidden'
					}}
				>
					<Image source={{ uri: image }} style={{ width: 250, height: 250 }} />
				</View>
				<Text
					onPress={this._copyToClipboard}
					onLongPress={this._share}
					style={{ paddingVertical: 10, paddingHorizontal: 10 }}
				/>

				<Text>Raw JSON:</Text>

				{this.state.response && this.state.items &&
					this.state.items.map((item,i)=>
						<ListItem
							key={i}
							title={item.name}
							rightTitle={item.price}
							bottomDivider
						/>)}
			</View>
		);
	};

	/*
	(
					<View
						onPress={this._copyToClipboard}
						onLongPress={this._share}
						style={{ paddingVertical: 10, paddingHorizontal: 10 }}
					>
					*/

	_keyExtractor = (item, index) => item.id;

	_renderItem = item => {
		<Text>response: {JSON.stringify(item)}</Text>;
	};

	_share = () => {
		Share.share({
			message: JSON.stringify(this.state.googleResponse.responses),
			title: 'Check it out',
			url: this.state.image
		});
	};

	_copyToClipboard = () => {
		Clipboard.setString(this.state.image);
		alert('Copied to clipboard');
	};

	_takePhoto = async () => {
		let pickerResult = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			//aspect: [4, 3]
		});

		this._handleImagePicked(pickerResult);
	};

	_pickImage = async () => {
		let pickerResult = await ImagePicker.launchImageLibraryAsync({
			allowsEditing: true,
			//aspect: [4, 3]
		});

		this._handleImagePicked(pickerResult);
	};

	_handleImagePicked = async pickerResult => {
		try {
			this.setState({ uploading: true });

			if (!pickerResult.cancelled) {
				uploadUrl = await uploadImageAsync(pickerResult.uri);
				this.setState({ image: uploadUrl });
			}
		} catch (e) {
			console.log(e);
			alert('Upload failed, sorry :(');
		} finally {
			this.setState({ uploading: false });
		}
	};

	submitToGoogle = async () => {
		try {
			this.setState({ uploading: true });
			let { image } = this.state;
			let body = JSON.stringify({
				requests: [
					{
						features: [
							{ type: 'DOCUMENT_TEXT_DETECTION' }
						],
						image: {
							source: {
								imageUri: image
							}
						}
					}
				]
			});
			let response = await fetch(
				'https://vision.googleapis.com/v1/images:annotate?key=' +
					Environment['GOOGLE_CLOUD_VISION_API_KEY'],
				{
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					},
					method: 'POST',
					body: body
				}
			);
			let responseJson = await response.json();

			this.setState({
				response: responseJson.responses[0].fullTextAnnotation,
			});
			
			var text = [];
			var items = [], index = 0;
			var r = responseJson.responses[0].fullTextAnnotation.pages;
			console.log('lol');
			var start = false, end = false;
			var last_word = null, total = 0, item_x = null, price_x = null;
			var item = '', price = '';

			for(var page in r){
				for(var block in r[page].blocks){
					for(var paragraph in r[page].blocks[block].paragraphs){
						for(var word in r[page].blocks[block].paragraphs[paragraph].words){
							var w = r[page].blocks[block].paragraphs[paragraph].words[word];
							
							var temp = '';
							for(var c in w.symbols){
								temp += w.symbols[c].text;
							}
							console.log(temp);
							w.text = temp;
							text.push(w);
							// if(w['property']['detectedBreak']['type']=='SURE_SPACE'){
								
							// 	console.log(temp);
							// 	text.push(temp);
							// }
						}
					}
				}
			}

			text.sort((a,b)=>{
				if (Math.abs(a.boundingBox.vertices[0].y - b.boundingBox.vertices[0].y) > 15){
					return a.boundingBox.vertices[0].y > b.boundingBox.vertices[0].y;
				}else{
					return a.boundingBox.vertices[0].x > b.boundingBox.vertices[0].x;
				}
			});

			for(var i in text){
				var temp = text[i].text;
				// console.log(temp);
				// console.log(text[i].boundingBox.vertices[0].x);
				// console.log(text[i].boundingBox.vertices[0].y);
				// console.log('---------');
					if(temp == "GROCERY"){
						start = true;
						continue;
					}
					if(start){
						if(temp == "TOTAL"){
							//console.log(items);
							this.setState({items: items,uploading: false});
							return;
						}
						var tX = text[i].boundingBox.vertices[0].x;
						if(isNaN(temp)){
							if(item_x == null){
								item_x = tX;
								item += temp + ' ';
							}
							else{
								if (temp.length > 1 && (Math.abs(tX - item_x) < 20 || tX > item_x)
									&& temp == temp.toUpperCase())
									item += temp + ' ';
								if (temp == 'N' || temp == 'F'){
									if(price != ''){
										console.log(price);
										items[index]['price'] = price;
										price = '';
										index++;
									}
								}
								if (temp == '.' && (tX > price_x)){
									price += '.';
								}
							}
						}else{
							if(item_x != null){
								if(item != ''){
									console.log(item);
									items.push({name: item});
									item = '';
								}
								if(price_x == null){
									price_x = tX;
									price += temp;
								}else{
									if ((tX > price_x || Math.abs(tX - price_x) < 20)&& temp.length < 4)
										price += temp;
								}
							}
						}
					}
				}
		} catch (error) {
			console.log(error);
		}
	};
}

async function uploadImageAsync(uri) {
	const blob = await new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.onload = function() {
			resolve(xhr.response);
		};
		xhr.onerror = function(e) {
			console.log(e);
			reject(new TypeError('Network request failed'));
		};
		xhr.responseType = 'blob';
		xhr.open('GET', uri, true);
		xhr.send(null);
	});

	const ref = firebase
		.storage()
		.ref()
		.child(uuid.v4());
	const snapshot = await ref.put(blob);

	blob.close();

	return await snapshot.ref.getDownloadURL();
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		paddingBottom: 10
	},
	developmentModeText: {
		marginBottom: 20,
		color: 'rgba(0,0,0,0.4)',
		fontSize: 14,
		lineHeight: 19,
		textAlign: 'center'
	},
	contentContainer: {
		paddingTop: 30
	},

	getStartedContainer: {
		alignItems: 'center',
		marginHorizontal: 10
	},

	getStartedText: {
		fontSize: 17,
		color: 'rgba(96,100,109, 1)',
		lineHeight: 24,
		textAlign: 'center'
	},

	helpContainer: {
		marginTop: 15,
		alignItems: 'center'
	}
});