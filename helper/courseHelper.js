var db=require('../config/connection')

module.exports={
    getAllCourse:()=>{
        return new Promise(async(resolve,reject)=>{
            let course=await db.nttfDb().collection("course").find().sort({courseid:1}).toArray()
            resolve(course)
        })
    },
    getCourse:(courseid)=>{
        return new Promise(async(resolve,reject)=>{
            let course=await db.nttfDb().collection('course').findOne({courseid:courseid})
            resolve(course)
        })
    },
    addCourse:async(course)=>{


        var dbcourse=await db.nttfDb().collection('course').find().toArray()
        var coursetrue=true

        return new Promise((resolve,reject)=>{

            for(var i=0;i<dbcourse.length;i++)
            {
                if(dbcourse[i].courseid===course.courseid)
                {
                    coursetrue=false
                    resolve ({status:false})
                }
            }
            if(coursetrue)
            {
                db.nttfDb().collection('course').insertOne(course)
                resolve({status:true})
            }
            
        })
    },
    getCourseAndStaff:()=>{

       
        return new Promise(async(resolve,reject)=>{
            var course=await db.nttfDb().collection('course').find().sort({courseid:1}).toArray()
        
            for(var i=0;i<course.length;i++)
            {
                var staff=await db.nttfDb().collection('staff').find({course:course[i].courseid}).sort({staffid:1}).toArray()
                if(staff)
                {
                    for(var j=0;j<staff.length;j++)
                    {
                        if(staff[j].year===1)
                        {
                            course[i].firstyear=staff[j].firstname+" "+staff[j].lastname
                        }
                        else if(staff[j].year===2)
                        {
                            course[i].secondyear=staff[j].firstname+" "+staff[j].lastname
                        }
                        else if(staff[j].year===3)
                        {
                            course[i].thirdyear=staff[j].firstname+" "+staff[j].lastname
                        }
                    }
                }
                
    
            }
            resolve(course)
            console.log(course);
        })
    }
}