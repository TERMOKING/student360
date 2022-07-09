var db=require('../config/connection')

module.exports={
    updateSemester:(course)=>{
        var courseid=course.courseid
            db.nttfDb().collection('trainees').updateMany({course:courseid},{$inc:{semester:1}})
            db.nttfDb().collection(courseid+1+"attendance").deleteMany()
            db.nttfDb().collection(courseid+2+"attendance").deleteMany()
            db.nttfDb().collection(courseid+3+"attendance").deleteMany()

          

            return
    },
    updateYear:()=>{
        return new Promise((resolve,reject)=>{

        db.nttfDb().collection('trainees').updateMany({semester:1},
            {
                $set:{
                    year:1
                }
            })
        db.nttfDb().collection('trainees').updateMany({semester:3},
            {
                $set:{
                    year:2
                }
            })
        db.nttfDb().collection('trainees').updateMany({semester:5},
            {
                $set:{
                    year:3
                }
            })
        db.nttfDb().collection('trainees').updateMany({semester:7},
            {
                $set:{
                    year:null
                }
            })
        resolve()
    })      
    }
}