var Userdb = require('../model/model');
const redis_client = require('../../redis_connect');

// create and save new user
exports.create = (req,res)=>{
    // validate request
    if(!req.body){
        res.status(400).send({ status: false, message : "Content can not be emtpy!", data:{}});
        return;
    }

    // new user
    const user = new Userdb({
        userName : req.body.userName,
        accountNumber : req.body.accountNumber,
        emailAddress : req.body.emailAddress,
        identityNumber: req.body.identityNumber
    })

    // save user in the database
    user
        .save(user)
        .then(data => {
            res.status(200).send({ status: true, message: "success", data: {user}});
            // res.send(data)
            //res.redirect('/add-user');
        })
        .catch(err =>{
            res.status(500).send({
                status: false, message : err.message || "Some error occurred while creating a create operation", data: {user}
            });
        });

}

// retrieve and return all users/ retrive and return a single user
exports.find = async(req, res)=>{
    if(req.query.id || req.query.accountNumber || req.query.identityNumber){
        const id = req.query.id ? req.query.id : "";
        const accountNumber = req.query.accountNumber ? req.query.accountNumber : "";
        const IdentityNumber = req.query.identityNumber ? req.query.identityNumber : "";
        // const redis_key = id;
        // var is_data=true;

        redis_client.get('data_list', (err, data)=>{
            if (err) throw err;
            
            if (data !== null) {
                console.log('get from redis data list');
                //res.send(data);
                data = JSON.parse(data);
                //console.log(data);
                var is_redis=false;
                var r =[];
                data.forEach(usr => {
                    if(usr._id==id){
                        console.log('id same redis');
                        is_redis=true;
                        r.push(usr);
                        //res.send(usr);
                    } else if(usr.accountNumber==accountNumber){
                        console.log('accountNumber same redis');
                        is_redis=true;
                        r.push(usr);
                        // res.send(usr);
                    } else if(usr.identityNumber==IdentityNumber){
                        console.log('IdentityNumber same redis');
                        is_redis=true;
                        // res.send(usr);
                        r.push(usr);
                    }    
                });
                 
                if(is_redis==false){
                        console.log('not cocok');
                        var name = "";
                        var value = "";
                        var query = {};
                        if(id!=""){ name='_id'; value = id;}
                        if(accountNumber!=""){name='accountNumber'; value=accountNumber}
                        if(IdentityNumber!=""){name='identityNumber'; value=IdentityNumber}
                        query[name] = value;
                        console.log(query);
                        
                        // Userdb.findById(id)
                        Userdb.find(query)
                        .then(data =>{
                            if(!data){
                                res.status(404).send({status: false, message : "Not found user"})
                            }else{
                                console.log('get from mongo');
                                //console.log(data);
                                //data = JSON.parse(data);
                                var User=[];
                                // User.push(data);
                                data.forEach(usr => {
                                    redis_client.setex(usr._id.toString(), 1600, JSON.stringify(usr));
                                    //res.send(usr)
                                    User.push(usr);
                                });
                                //redis_client.setex('data_list', 1600, JSON.stringify(data));
                                res.send({status: true, message : "success", data:{User}})
                            }
                        })
                        .catch(err =>{
                            res.status(500).send({ status: false, message: "Error retrieving user with id " + err})
                        })
                } else{
                    console.log('is redis');
                    res.send({status: true, message: "success", data: {r}});
                }

            }else{
                // is_data=false;
                console.log('get from mongo1');
                //res.status(500).send({ message: "Erro retrieving user with id "})
                Userdb.find()
                .then(user => {
                    //console.log(user);
                    redis_client.setex('data_list', 1600, JSON.stringify(user));
                    var r =[];
                    user.forEach( usr => {
                        usr._id = usr._id ? usr._id : "";
                        if(usr._id.toString()==id){
                            redis_client.setex(usr._id.toString(), 1600, JSON.stringify(usr));
                            r.push(usr);
                        } else if(usr.accountNumber==accountNumber){
                            redis_client.setex(usr._id.toString(), 1600, JSON.stringify(usr));
                            r.push(usr);
                        } else if(usr.identityNumber==IdentityNumber){
                            redis_client.setex(usr._id.toString(), 1600, JSON.stringify(usr));
                            r.push(usr);
                        }
                    });
                    res.send({status: true, message: "success", data: {r}});
                    //next()
                })
                .catch(err => {
                    res.status(500).send({status: false, message : err.message || "Error Occurred while retriving user information"})
                })
                
            }
            // next()
        });
    }
    else{
        Userdb.find()
            .then(user => {
                // console.log(user);
                user.forEach( usr => {
                    redis_client.setex(usr._id.toString(), 1600, JSON.stringify(usr));
                });
                redis_client.setex('data_list', 1600, JSON.stringify(user));
                res.send({status: true, message: "success", data: {user}});
            })
            .catch(err => {
                res.status(500).send({status: false, message : err.message || "Error Occurred while retriving user information" })
            })
    }

    
}

// Update a new idetified user by user id
exports.update = (req, res)=>{
    if(!req.body){
        return res
            .status(400)
            .send({status: false, message : "Data to update can not be empty"})
    }

    const id = req.params.id;
    Userdb.findByIdAndUpdate(id, req.body, { useFindAndModify: false})
        .then(data => {
            if(!data){
                res.status(404).send({ status: false, message : `Cannot Update user with ${id}. Maybe user not found!`})
            }else{
                res.send({status: true, message: "success", data: {data}})
            }
        })
        .catch(err =>{
            res.status(500).send({ status: false, message : "Error Update user information"})
        })
}

// Delete a user with specified user id in the request
exports.delete = (req, res)=>{
    const id = req.params.id;

    Userdb.findByIdAndDelete(id)
        .then(data => {
            if(!data){
                res.status(404).send({ status: false, message : `Cannot Delete with id ${id}. Maybe id is wrong`})
            }else{
                res.send({
                    status: true,
                    message : "User was deleted successfully!"
                })
            }
        })
        .catch(err =>{
            res.status(500).send({
                status: false,
                message: "Could not delete User with id=" + id
            });
        });
}