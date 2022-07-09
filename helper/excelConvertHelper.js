var db = require("../config/connection");
var express = require('express');
const XLSX = require('xlsx');

module.exports = {
    getTraineeProfile:async(id)=>{
        var profile = await db.nttfDb().collection('trainees').find().toArray();
    },
    getTraineeByYearCourse: async (course,year)=>{
        console.log(year);
        var profile = await db.nttfDb().collection('trainees').find({ $and: [{ course: course }, { year: parseInt(year) }] }).toArray();
        if(profile)
        {
            var path="./public/downloads/profiles/profile.xlsx"
            excelDownloader(profile,path);
        }
        return;
    },
    getMentoringByTrainee:(tokennumber)=>{
        return new Promise(async(resolve,reject)=>{
            var mentoring = await db.nttfDb().collection('mentoring').findOne({tokennumber:tokennumber})
            if(mentoring){
                if(mentoring.mentor)
                {
                var path="./public/downloads/profiles/"+tokennumber+"mentor.xlsx"
                excelDownloader(mentoring.mentor,path)
                resolve(true)
                }
            }
            resolve()
        })
    }
}


excelDownloader = async function(profile,path) {
    const worksheet = XLSX.utils.json_to_sheet(profile);
    const workbook = XLSX.utils.book_new();
    console.log(profile);
    XLSX.utils.book_append_sheet(workbook, worksheet, "profile");
    XLSX.write(workbook, {
        bookType: 'xlsx',
        type:'buffer'
    })
    XLSX.write(workbook, {
        bookType : 'xlsx',
        type:'binary'
    });
    XLSX.writeFile(workbook,path);
    return;
}
