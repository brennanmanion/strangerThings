module.exports = async function(){
    const axios = require('axios');
    const cheerio = require('cheerio')

    const data = await axios.get('http://api.tvmaze.com/singlesearch/shows?q=stranger-things&embed=episodes')
    .then(response => response.data)
    .catch(error => {
        throw error;
    })

    let episodes = [];
    let seasonCount = {};
    let minutesCount = {};

    const responseData = data;
    const showId = responseData.id;
            
    const episodeObjects = responseData._embedded.episodes;
    
    for(let i=0;i<episodeObjects.length;i++){
        const thisEpisode = episodeObjects[i];
        
        const payload = {}
        
        if(Object.prototype.hasOwnProperty.call(seasonCount,thisEpisode.season.toString())){
            seasonCount[thisEpisode.season.toString()] += 1;
            minutesCount[thisEpisode.season.toString()] += thisEpisode.runtime;
        }
        else{
            seasonCount[thisEpisode.season.toString()] = 1;
            minutesCount[thisEpisode.season.toString()] = thisEpisode.runtime;
        }

        payload["sequenceNumber"] = 's' + thisEpisode.season.toString(); + 'e' + thisEpisode.number.toString();
        
        // alternatively, we could convert the season number to a string, and replace 
        // 'Chapter ' + convertedSeasonNumberToString
        // replaceLongTitle = 'Chapter ' + parseInt(thisEpisode.number) + ':';
        payload["shortTitle"] = thisEpisode.name.split(':')[1];


        // convert to EpochTime 
        // divide milliseconds by 1000 to get epoch time in seconds
        payload["airTimestamp"] = (new Date(thisEpisode.airstamp).getTime())/1000 ;
        
        let shortSummary = null;        
        if(Object.prototype.hasOwnProperty.call(thisEpisode,"summary") && thisEpisode["summary"]!=null){
            // assuming the HTML tags will always be a paragraph tag        
            var html = thisEpisode.summary;
            
            const $ = cheerio.load(html)
            var paragraph = $('p').html();
            
            // first sentence of summary without HTML tags
            shortSummary = paragraph.split('.')[0] + '.';                                                
        }
        payload["shortSummary"] = shortSummary;
        
        const episode = {[thisEpisode.id]:payload};   
        episodes.push(episode);         
    }

    let totalEpisodes = 0
    const seasonCountArray = Object.keys(seasonCount);    
    for(let i=0;i<seasonCountArray.length;i++){
        totalEpisodes += seasonCount[seasonCountArray[i]];
    }
    const averageEpisodesPerSeason = totalEpisodes / Object.keys(seasonCount).length;

    let totalDurationSec = 0
    const minutesCountArray = Object.keys(minutesCount);
    for(let i=0;i<minutesCountArray.length;i++){
        totalDurationSec += minutesCount[minutesCountArray[i]];
    }
    // convert minutes to seconds
    totalDurationSec *= 60;

    const seriesPayload = {
        'totalDurationSec':totalDurationSec,
        'averageEpisodesPerSeason':averageEpisodesPerSeason,
        'episodes':episodes
    }
    const restructuredObject = {[showId]:seriesPayload}        
    
    return(restructuredObject);            

}