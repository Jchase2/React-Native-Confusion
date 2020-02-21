import React, { Component } from 'react';
import { View, Text, ScrollView, FlatList, Button, Modal, StyleSheet, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite, postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
    return {
        dishes: state.dishes,
        comments: state.comments,
        favorites: state.favorites,
    }
}

const mapDispatchToProps = dispatch => ({
    postFavorite: (dishId) => dispatch(postFavorite(dishId)),
    postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment)),
});

function RenderDish(props) {
    const dish = props.dish;

    handleViewRef = ref => this.view = ref;

    const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
        if (dx < -200)
            return true;
        else if (dx > 200)
            return true
        else
            return false;
    }

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (e, gestureState) => {
            return true;
        },
        onPanResponderGrant: (e, gestureState) => {
            this.view.rubberBand(1000)
            .then(endState => console.log(endState.finish ? 'finished' : 'cancelled'));
        },
        onPanResponderEnd: (e, gestureState) => {
            console.log("pan responder end", gestureState);
            if (recognizeDrag(gestureState))
                if (gestureState.dx < -200){
                    Alert.alert(
                        'Add Favorite',
                        'Are you sure you wish to add ' + dish.name + ' to favorite?',
                        [
                            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                            { text: 'OK', onPress: () => { props.favorite ? console.log('Already favorite') : props.onPress() } },
                        ],
                        { cancelable: false }
                    );
                }
                else if(gestureState.dx > 200){
                    // This is toggleModal() but passed in as onPressTwo via props. 
                    props.onPressTwo();
                }

            return true;
        }
    })

    const shareDish = (title, message, url) => {
        Share.share({
            title: title,
            message: title + ': ' + message + ' ' + url,
            url: url
        }, {
            dialogTitle: 'Share ' + title
        });
    }

    if (dish != null) {
        return (
            <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
                ref={this.handleViewRef}
                {...panResponder.panHandlers}>
                <Card
                    featuredTitle={dish.name}
                    image={{ uri: baseUrl + dish.image }}>
                    <Text style={{ margin: 10 }}>
                        {dish.description}
                    </Text>
                    <View style={styles.btnCenter}>
                        <Icon raised reverse name={props.favorite ? 'heart' : 'heart-o'} type='font-awesome' color='#f50'
                            onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()} />
                        <Icon raised reverse name={'pencil'} type='font-awesome' color='#f50'
                            onPress={() => { props.onPressTwo() }} />
                        <Icon raised reverse name='share' type='font-awesome' color='#512DA8' style={styles.cardItem}
                            onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} />
                    </View>
                </Card>
            </Animatable.View>
        );
    }
    else {
        return (<View></View>)
    }
}

function RenderComments(props) {
    const comments = props.comments;
    const renderCommentItem = ({ item, index }) => {
        return (
            <View key={index} style={{ margin: 10 }}>
                <Text style={{ fontSize: 14 }}>{item.comment}</Text>
                <Rating
                    imageSize={20}
                    readonly
                    startingValue={item.rating}
                    style={styles.starAlign}
                />
                <Text style={{ fontSize: 12 }}>{'-- ' + item.author + ', ' + item.date}</Text>
            </View>
        );
    }
    return (
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
            <Card title="comments">
                <FlatList data={comments} renderItem={renderCommentItem} keyExtractor={item => item.id.toString()} />
            </Card>
        </Animatable.View>
    );
}

class DishDetail extends Component {

    constructor(props) {
        super(props);
        this.state = {
            Rating: 5,
            Author: '',
            Comment: '',
            showModal: false
        }
        this.toggleModal = this.toggleModal.bind(this);
    }

    markFavorite(dishId) {
        this.props.postFavorite(dishId);
    }

    static navigationOptions = {
        title: 'Dish Details',
    }

    toggleModal() {
        this.setState({ showModal: !this.state.showModal });
    }

    resetForm() {
        this.setState({
            Rating: 0,
            Author: '',
            Comment: '',
            showModal: false
        });
    }

    ratingCompleted = (rating) => {
        const newRating = rating;
        console.log(newRating);
        this.setState({ Rating: newRating })
    }

    handleComment = (dishId, rating, author, comment) => {
        this.props.postComment(dishId, rating, author, comment);
        this.toggleModal();
    }

    render() {
        const dishId = this.props.navigation.getParam('dishId', '');
        return (
            <ScrollView>
                <RenderDish dish={this.props.dishes.dishes[+dishId]}
                    favorite={this.props.favorites.some(el => el === dishId)}
                    onPress={() => this.markFavorite(dishId)}
                    onPressTwo={() => this.toggleModal()}
                />
                <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />

                <Modal animationType={"slide"} transparent={false}
                    visible={this.state.showModal}
                    onDismiss={() => this.toggleModal()}
                    onRequestClose={() => this.toggleModal()}>
                    <View style={styles.modal}>
                        <Rating
                            startingValue={10}
                            defaultRating={10}
                            showRating
                            style={{ paddingVertical: 10 }}
                            size={1}
                            onFinishRating={this.ratingCompleted}
                        />
                        <Input
                            placeholder='Author'
                            leftIcon={{ type: 'font-awesome', name: 'user' }}
                            value={this.state.Author}
                            onChangeText={author => this.setState({ Author: author })}
                        />
                        <Input
                            placeholder='Comment'
                            leftIcon={{ type: 'font-awesome', name: 'comment' }}
                            value={this.state.Comment}
                            onChangeText={comment => this.setState({ Comment: comment })} />
                        <Text style={styles.modalText}>Comment: {this.state.comment}</Text>
                        <View style={{ marginBottom: 10 }}>
                            <Button onPress={() => { this.handleComment(dishId, this.state.Rating, this.state.Author, this.state.Comment); }}
                                color="#512DA8"
                                title="Submit"
                            />
                        </View>
                        <Button
                            onPress={() => { this.toggleModal(); this.resetForm(); }}
                            color="#512DA8"
                            title="Close"
                        />
                    </View>
                </Modal>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'center',
        margin: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#512DA8',
        textAlign: 'center',
        color: 'white',
        marginBottom: 20,
    },
    modalText: {
        fontSize: 18,
        margin: 10
    },
    btnCenter: {
        justifyContent: 'center',
        flexDirection: 'row'
    },
    starAlign: {
        justifyContent: 'flex-start',
        flexDirection: 'row'
    }
});

export default connect(mapStateToProps, mapDispatchToProps)(DishDetail);