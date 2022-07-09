const mongoClient = require('mongodb').MongoClient


const nttfDb={
    db:null
}



module.exports.connect=(done)=>{
    
    mongoClient.connect('mongodb://localhost:27017',{useNewUrlParser:true},(err,data)=>{
        if(err) return done(err)
        nttfDb.db=data.db('NTTF')
        done()
    })
}

module.exports.nttfDb=function(){
    return nttfDb.db
}

