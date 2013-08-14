/*
 *      To update table:
 * make function 'async'
 * #.Functions.functions leaderboard = new #.Functions.functions();
 * Globals.ResultId = await leaderboard.SendResults(App.Data.PlayerName, hits, misses);
 *      To display leaderboard, navigate to LeaderboardPage:
 * this.rootPage.GetFrameContent().Navigate(typeof(LeaderboardPage), this.rootPage);
 *
 */

 
public static class Globals
{
    public static int ResultId;
}


namespace $namespace.Functions
{

    using System;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading.Tasks;

    using $namespace.Entities;
    using $namespace.Model;

    using Windows.UI.Popups;
    using Windows.UI.Xaml;
    using Windows.UI.Xaml.Controls;
    using Windows.UI.Xaml.Navigation;

    public class functions
    {

        // insert data into leaderboard tables
        public async Task<int> SendResults(string player, int hits, int misses)
        {
            var resultsEntity = new $result { PlayerName = player, Hits = hits, Misses = misses };
            await App.MobileService.GetTable<$result>().InsertAsync(resultsEntity);

            return resultsEntity.Id;
        }
    }
}