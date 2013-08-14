// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved

namespace $namespace
{
    using System;
    using System.Diagnostics;
    using System.Linq;
    
    using Windows.UI.Popups;
    using Windows.UI.Xaml;
    using Windows.UI.Xaml.Controls;
    using Windows.UI.Xaml.Navigation;

    using $namespace.Functions;
    using $namespace.Entities;
    using $namespace.Model;    


    /// <summary>
    /// An empty page that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class LeaderboardPage : Page
    {
        private MainPage rootPage;

        public LeaderboardPage()
        {
            this.InitializeComponent();
        }        

        /// <summary>
        /// Invoked when this page is about to be displayed in a Frame.
        /// </summary>
        /// <param name="e">Event data that describes how this page was reached.  The Parameter
        /// property is typically used to configure the page.</param>
        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            this.rootPage = e.Parameter as MainPage;

            // display leaderboard
            this.RefreshLeaderboard();

        }

        // displaying leaderboard
        public async void RefreshLeaderboard()
        {
            var sw = new Stopwatch();
            sw.Start();

            var leaderboardUpdated = false;
            while (!leaderboardUpdated && sw.ElapsedMilliseconds < 5000)
            {
                var aux = await App.MobileService.GetTable<$result>().Where(r => r.Id == Globals.ResultId).ToEnumerableAsync();

                var resultsItem = aux.Single();
                leaderboardUpdated = resultsItem.LeaderboardUpdated;
            }

            sw.Stop();

            if (leaderboardUpdated)
            {
                var leaderboardItems = await App.MobileService.GetTable<$leaderboard>().ToEnumerableAsync();
                leaderboardItems = leaderboardItems.OrderBy(item => item.Position).Take(5);

                var model = new LeaderboardModel();
                foreach (var item in leaderboardItems)
                {
                    model.Items.Add(new LeaderboardItemModel
                    {
                        Player = item.PlayerName,
                        Position = item.Position,
                        Score = item.Score
                    });
                }

                this.DataContext = model;

                this.LoadingLeaderboardLegend.Visibility = Windows.UI.Xaml.Visibility.Collapsed;
                this.LoadingLeaderboardProgressRing.Visibility = Windows.UI.Xaml.Visibility.Collapsed;
                this.LeaderboardGridView.Visibility = Windows.UI.Xaml.Visibility.Visible;
            }
            else
            {
                this.LoadingLeaderboardLegend.Visibility = Windows.UI.Xaml.Visibility.Collapsed;
                this.LoadingLeaderboardProgressRing.Visibility = Windows.UI.Xaml.Visibility.Collapsed;

                var msg = new MessageDialog("The leaderboard could not be retrieved, please check if the server-side script is properly configured on the mobile service.");
                await msg.ShowAsync();
            }
        }
    }
}
