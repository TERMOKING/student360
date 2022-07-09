var db=require('../config/connection')
var objectId=require('mongodb').ObjectId
const bcrypt = require('bcryptjs')
var XLSX       = require('xlsx');
var mongoose = require('mongoose')

module.exports={
    getAttendance:(cname)=>{

        return new Promise(async (resolve,reject)=>{
            var date=new Date()
            var curmonth=date.getMonth()+1
            var curyear=date.getFullYear()
            var attendance=[]
            
            
            var fullAttendance=await db.nttfDb().collection(cname+"attendance").find().sort({tokennumber:1}).toArray()
    
    
            if(fullAttendance.length!=0)
            {
            for(var i=0;i<fullAttendance.length;i++)
            {
                var currentobj=fullAttendance[i]
                var curstatus=currentobj.status
                var percentage=currentobj.percentage
    
                var obj={
                    tokennumber:currentobj.tokennumber,
                    status:[],
                    percentage:percentage
                }
                attendance[i]=obj
                var count=0
                for(var j=0;j<curstatus.length;j++)
                {
                    var dbdate=curstatus[j].date
                    var dbmonth=dbdate.getMonth()+1 
                    var dbyear=dbdate.getFullYear()
    
                    if(dbmonth===curmonth &&dbyear===curyear)
                    {
                        
                        attendance[i].status[count]=curstatus[j]
                        count++
                    }
                }
            }
            var attendance=await jsdateToString(attendance)
        }
            resolve(attendance)
        })
    },
    // addAttendance:(trainee)=>{
        
    //     return new Promise((resolve,reject)=>{
            
          
            
    //         db.nttfDb().collection("cp08").insertOne(trainee)
    //         resolve()
    //     })
    // },
    addAttendance:(trainees,course,year)=>{
        
        return new Promise(async(resolve,reject)=>{
            
            var cname=course+year

            let attendance=await db.nttfDb().collection(cname+"attendance").findOne()
            if(attendance)
            {
                
                for(var i=0;i<Object.keys(trainees).length;i++)
                {
                    var current=Object.keys(trainees)[i];

                    var status={
                        date:new Date(),
                        status:Object.values(trainees)[i]
                    }

                    await db.nttfDb().collection(cname+"attendance")
                    .updateOne({tokennumber:current},
                        {
                            
                                $push:{status:status}
                            
                        })
                    
                }
                resolve()
                                    
            }
            else
            {
                for(let i=0;i<Object.keys(trainees).length;i++)
                {
                    
                    var current=Object.keys(trainees)[i];
                    student={
                        
                        tokennumber:current,
                        status:[
                            {
                                date:new Date(),
                                status:Object.values(trainees)[i]
                            }
                        ]
                    }
                    await db.nttfDb().collection(cname+"attendance").insertOne(student)
                    
                }
                resolve()
                
            }
            
        })
    },
    attendancePercentage:async(cname)=>{

        var obj=await db.nttfDb().collection(cname+"attendance").find().sort({tokennumber:1}).toArray()
        for(var i=0;i<Object.keys(obj).length;i++)
        {
            var p=0
            var a=0
            var per=0
            var current=Object.values(obj)[i]
            var status=current.status

            for(var j=0;j<status.length;j++)
            {
                if(status[j].status)
                {
                    p=p+1
                }
                else
                {
                    a=a+1
                }
            }
            var u=p*100
            var d=a+p
            var per=parseInt(u/d)
            await db.nttfDb().collection(cname+"attendance")
            .updateOne({tokennumber:current.tokennumber},
                {
                    $set:{
                        percentage:per
                    }

                })
        }
            
        
    },
    getAttendanceByMonth:async(date,cname)=>{

        var curmonth=date.getMonth()+1
        var curyear=date.getFullYear()
        var attendance=[]
        
        
        var fullAttendance=await db.nttfDb().collection(cname+"attendance").find().sort({tokennumber:1}).toArray()


        if(fullAttendance.length!=0)
        {
            for(var i=0;i<fullAttendance.length;i++)
            {
                var currentobj=fullAttendance[i]
                var curstatus=currentobj.status
                var percentage=currentobj.percentage

                var obj={
                    tokennumber:currentobj.tokennumber,
                    status:[],
                    percentage:percentage
                }
                attendance[i]=obj
                var count=0
                for(var j=0;j<curstatus.length;j++)
                {
                    var dbdate=curstatus[j].date
                    var dbmonth=dbdate.getMonth()+1 
                    var dbyear=dbdate.getFullYear()

                    if(dbmonth===curmonth &&dbyear===curyear)
                    {
                        
                        attendance[i].status[count]=curstatus[j]
                        count++
                    }
                }
            }
        var attendance=await jsdateToString(attendance)
    }
        return attendance
    },

    getAttendanceByTrainee:(trainee)=>{
        var course=trainee.course
        var year=trainee.year
        return new Promise(async(resolve,reject)=>{
            var attendance=await db.nttfDb().collection(course+year+'attendance').findOne({tokennumber:trainee.tokennumber})
            if(attendance)
            {
                var status=attendance.status
            for(var i=0;i<status.length;i++)
            {
                var date=status[i].date
                status[i].date=dateOnly(date)
            }

                resolve(attendance)
            }
            resolve()
        })
    }
}



function dateOnly(date){

    var day=date.getDate()  
    var month=date.getMonth()+1 
    var year=date.getFullYear()
  
    return day+'/'+month+'/'+year
  }


function jsdateToString(object){

    var current
    var date
    var status

    for(var i=0;i<1;i++)
    {
        current=object[i]

        status=current.status
        
        for(var j=0;j<status.length;j++)
        {
            date=status[j]
            date.date=dateOnly(date.date)   
            status[j]=date      
        }
        current.status=status
        object[i]=current
    }

    return object

}



