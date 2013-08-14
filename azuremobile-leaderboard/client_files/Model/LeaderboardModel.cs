// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved

namespace $namespace.Model
{
    using System.Collections.Generic;

    public class LeaderboardModel
    {
        public LeaderboardModel()
        {
            this.Items = new List<LeaderboardItemModel>();
        }

        public IList<LeaderboardItemModel> Items { get; set; }
    }
}
