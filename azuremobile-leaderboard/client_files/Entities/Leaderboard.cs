// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved

namespace $namespace.Entities
{
    using System.Runtime.Serialization;

    public class $leaderboard
    {
        [DataMember(Name = "id")]
        public int Id { get; set; }

        [DataMember(Name = "position")]
        public int Position { get; set; }

        [DataMember(Name = "playerName")]
        public string PlayerName { get; set; }

        [DataMember(Name = "score")]
        public int Score { get; set; }
    }
}
