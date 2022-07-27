---
title: Brute Forcing Super Auto Pets
date: 2050-05-02
---

Super auto pets describes itself as a friendly auto battler game. You build a team of pets, combining their powers and leveling them up and set them to battle other teams with the battle portion being automated and mostly random free. Free to play, on steam and iOS, it's also about as addictive as heroin laced malteasers.

I have been playing it a good amount recently, but am not very good at it. As such I was curious if anyone had worked out optimal combinations of pets. A few searches turned up this reddit thread https://www.reddit.com/r/superautopets/comments/qv1gzg/i_simulated_11902500_possible_round_1_matchups_in/ where someone simulated all of the possible round 1 matchups. Annoyingly what this showed was what I already suspected, in that the combination of a powerful pet and one to buff it was the way to go. Where I was having trouble was in late game. Should I continue to buff my current pets or switch to pets with strong abilities?

Naturally this seemed like as good an opportunity to write some code. While I am sure someone out there could use statistics to calculate the optimal stratergies and such I thought I would just try some old fashined brute force.

To start we need to understand the game.

You start each round by default with 10 gold, and a choice of pets to buy or buffs to apply to them. Bu default pets or buffs cost 3 gold. Pets come with 2 base stats health and attack. However they also have a tier level. So tier 1 pets will be offered on the first round and tier 2-6 on later ones. On the first round you get the option to buy 3 randomly chosen pet or 1 buff. Later rounds expanding the number of pets offered and the number of buffs to 5 and 2.

You can have at most 5 pets in your team, and you get the chose the order of the pets.

Where things get interesting is that pets often have abilities. For example the ant when it faints (is knocked out by another pet and its current health is 0) will at level 1 buff a randomly chosen pet in your team with +2 attack and +1 health. At level 2 this increases to +4 and +2 and at level three +6 and +3. So an obvious stratergy is to put at least 1 pet behind an ant so when the ant faints it buffs the pet behind it.

To level up a pet you either purchase more of the same pet and combine them which increases their base stats, but if you have combined 3 level 1 pets will turn it into a level 2. When you do this, you also get unlock a single higher level tier pet (if  there are higher ones) to buy. This means you can get more powerful pets before other players if you time things correctly.

Buffs mostly apply on the pets themselves doing things like permenantly or temporarly increasting their base attack and health stats, causing them to faint, level up and such other effects. There are also some buffs which apply only to future pets offered, buffing them up before you buy them.

A battle requires no intervention from the user and plays out according to the pets abilities and stats.






