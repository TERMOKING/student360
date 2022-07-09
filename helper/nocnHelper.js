var db = require("../config/connection");

module.exports={
    addModule:(module)=>{
        return new Promise((resolve,reject)=>{
            db.nttfDb().collection('nocnmodules').insertOne(module).then(()=>{
                resolve()
            })
        })
    },
    getAllModules:()=>{
        return new Promise((resolve,reject)=>{
            db.nttfDb().collection('nocnmodules').find().toArray().then((modules)=>{
                resolve(modules)
            })
        })
    },
    getStatus:(moduleid)=>{
        return new Promise((resolve,reject)=>{

        })
    }
}