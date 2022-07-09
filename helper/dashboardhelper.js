var db = require("../config/connection");


module.exports={
    getCount:()=>{
        var count={}
        return new Promise(async(resolve,reject)=>{
            var trainee=await db.nttfDb().collection('trainees').find().toArray()
            var staff=await db.nttfDb().collection('staff').find().toArray()
            
            count.trainee=trainee.length
            count.staff=staff.length
            resolve(count)
            
        })
    },

    getPresentCountByStudent:(user)=>{
        var course=user.course
        var year=user.year
        return new Promise(async(resolve,reject)=>{
            var count={}
            var present=0
            var absent=0

            var attendance=await db.nttfDb().collection(course+year+'attendance').findOne({tokennumber:user.tokennumber})
            var status
            if(attendance)
            {
                status=attendance.status
                for(var i=0;i<status.length;i++)
                {
                    if(status[i].status===true)
                    {
                        present++
                    }
                    else
                    {
                        absent++
                    }
                }
                count={
                    present:present,
                    absent:absent
                }
            }
            
            
            resolve(count)

        })
    },
    getCountbyCourse :async(course,year)=>{

        var cp08 = await db.nttfDb().collection('trainees').find({course:'cp08'}).toArray()
        cp08=cp08.length
        var cp09 = await db.nttfDb().collection('trainees').find({course:'cp09'}).toArray()
        cp09=cp09.length
        var cp15 = await db.nttfDb().collection('trainees').find({course:'cp15'}).toArray()
        cp15=cp15.length

        return new Promise((resolve,reject)=>{
            resolve({cp08,cp09,cp15})
        }) 
    },
    getCountCourseYear:()=>{
        return new Promise(async(resolve,reject)=>{
            var course=await db.nttfDb().collection('course').find().toArray()

            for(var j=0;j<course.length;j++)
            {
                var courseId=course[j].courseid
                var firstyear=await db.nttfDb().collection('trainees').find({$and:[{course:courseId,year:1}]}).toArray()

                var firstyearhosteler=0
                var firstyeardayscholar=0
                for(var i=0;i<firstyear.length;i++)
                {
                    if(firstyear[i].category==='hosteler'){
                        firstyearhosteler++
                    }
                    else{
                        firstyeardayscholar++
                    }
                }

                var secondyear=await db.nttfDb().collection('trainees').find({$and:[{course:courseId,year:2}]}).toArray()
                var secondyearhosteler=0
                var secondyeardayscholar=0
                for(var i=0;i<secondyear.length;i++)
                {
                    if(secondyear[i].category==='hosteler'){
                        secondyearhosteler++
                    }
                    else{
                        secondyeardayscholar++
                    }
                }

                var thirdyear=await db.nttfDb().collection('trainees').find({$and:[{course:courseId,year:3}]}).toArray()
                var thirdyearhosteler=0
                var thirdyeardayscholar=0
                for(var i=0;i<thirdyear.length;i++)
                {
                    if(thirdyear[i].category==='hosteler'){
                        thirdyearhosteler++
                    }
                    else{
                        thirdyeardayscholar++
                    }
                }
                course[j].firstyear=firstyear.length
                course[j].firstyearhosteler=firstyearhosteler
                course[j].firstyeardayscholar=firstyeardayscholar

                course[j].secondyear=secondyear.length
                course[j].secondyearhosteler=secondyearhosteler
                course[j].secondyeardayscholar=secondyeardayscholar

                course[j].thirdyear=thirdyear.length
                course[j].thirdyearhosteler=thirdyearhosteler
                course[j].thirdyeardayscholar=thirdyeardayscholar
            }
            resolve(course)
        })
    }
    
    }

function dateOnly(date){

        var day=date.getDate() 
        var month=date.getMonth()+1 
        var year=date.getFullYear()
      
        return day+'/'+month+'/'+year
      }
    
async function getTodaysPresent(cname){
    var present=0
    var n=new Date()
    var today=n.getDate()
    var thismonth=n.getMonth()+1
    var thisyear=n.getFullYear()
    var obj=await db.nttfDb().collection(cname+"attendance").find().toArray() 

        for(var i=0;i<obj.length;i++)
        {
            var current=obj[i]
    
            var status=current.status
            
            for(var j=0;j<status.length;j++)
            {
                var day=status[j].date.getDate()
                var month=status[j].date.getMonth()+1
                var year=status[j].date.getFullYear()
                if(day===today && month===thismonth && year===thisyear)
                {
                    if(status[j].status==true)
                    {
                        present=present+1
                    }
                }
                  
            }
        }
    
    
        return present;
    
    }


    async function getTodaysAbsent(cname){
        var absent=0
        var n=new Date()
        var today=n.getDate()
        var obj=await db.nttfDb().collection(cname+"attendance").find().toArray() 
            for(var i=0;i<obj.length;i++)
            {
                var current=obj[i]
        
                var status=current.status
                
                for(var j=0;j<status.length;j++)
                {    
                    var day=status[j].date.getDate()
                    if(day===today && status[j].status==false)
                    {
                            absent=absent+1
                    }
                }
            }
        
            return absent;
        
        }


async function  getTraineeCountByCourse(course,year){


    var trainee=await db.nttfDb().collection('trainees').find({$and:[{course:course,year:year}]}).toArray()
    var i
    for(i=0;i<trainee.length;i++)
    {
    }
    return i
}