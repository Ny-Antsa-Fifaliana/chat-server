// Gestion de Users
const users = [];

//fonction helper
const addUser = ({id, name, room})=>{
    name= name.trim().toLowerCase();
    room= room.trim().toLowerCase();

    const existUser= users.find((user)=>user.nom === name && user.room===room)
    if(existUser){
        return{error: 'L\'utilisateur éxiste déjà!'};
    }

    const user= {id, name, room};
    users.push(user);
    return {user};
}
const removeUser = (id)=>{
    const index = users.findIndex((user)=> user.id===id);
    if(index!==-1){
        return users.splice(index,1)[0];
    }
}
const getUser = (id)=> {
    return users.find((user)=>user.id===id);
}

const getUsersInRoom = (room)=>{
    return users.filter((user)=>user.room===room);
}

module.exports  = {addUser, removeUser,getUser,getUsersInRoom}; 