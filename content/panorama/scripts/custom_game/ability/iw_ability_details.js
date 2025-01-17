"use strict";

var stAbilityDetailsStatNames =
[
	"iw_ui_ability_passive",
	"iw_ui_ability_stat_mana",
	"iw_ui_ability_stat_mana_upkeep",
	"iw_ui_ability_stat_stamina",
	"iw_ui_ability_stat_stamina_upkeep",
	"iw_ui_ability_stat_cooldown",
	"iw_ui_ability_stat_cast_range",
	"iw_ui_ability_stat_cast_time",
	"iw_ui_ability_stat_channel_time",
];

function OnAbilityDetailsComboIconMouseOver(hContextPanel)
{
	var szTooltipArgs = "abilityname=" + hContextPanel.GetAttributeString("name", "");
	$.DispatchEvent("UIShowCustomLayoutParametersTooltip", hContextPanel, "AbilityTooltip", "file://{resources}/layout/custom_game/tooltip/iw_tooltip_ability.xml", szTooltipArgs);
}

function OnAbilityDetailsComboIconMouseOut(hContextPanel)
{
	$.DispatchEvent("UIHideCustomLayoutTooltip", hContextPanel, "AbilityTooltip");
}

function OnAbilityDetailsPartyUpdate(hContextPanel, tArgs)
{
	if (tArgs.entindex)
	{
		hContextPanel.SetAttributeInt("entindex", tArgs.entindex);
		DispatchCustomEvent(hContextPanel, "AbilityDetailsSetVisible", { visible:false });
	}
	return true;
}

function OnAbilityDetailsSetVisible(hContextPanel, tArgs)
{
	hContextPanel.visible = tArgs.visible;
	return true;
}

function OnAbilityDetailsUpdate(hContextPanel, tArgs)
{
	var nAbilityIndex = tArgs.abilityindex;
	var nEntityIndex = hContextPanel.GetAttributeInt("entindex", -1);
	
	var szAbilityName = Abilities.GetAbilityName(nAbilityIndex);
	var tAbilityData = CustomNetTables.GetTableValue("abilities", nAbilityIndex);
	
	DispatchCustomEvent(hContextPanel, "AbilityDetailsSetVisible", { visible:true });
	hContextPanel.FindChildTraverse("TitleLabel").text = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName);
	hContextPanel.FindChildTraverse("Icon").SetImage("file://{images}/spellicons/" + Abilities.GetAbilityTextureName(nAbilityIndex) + ".png");
	hContextPanel.FindChildTraverse("StatsContainer").visible = true;
	hContextPanel.FindChildTraverse("ComboContainer").visible = false;
	
	var szBehaviorText = "";
	var hBehaviorLabel = hContextPanel.FindChildTraverse("Stat0");
	var nAbilityBehavior = Abilities.GetBehavior(nAbilityIndex);
	var nAbilityExtFlags = tAbilityData.extflags;
	
	if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_PASSIVE)
		szBehaviorText = $.Localize("iw_ui_ability_passive");
	else if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_CHANNELLED)
		szBehaviorText = $.Localize("iw_ui_ability_channeled");
	else if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_TOGGLE)
		szBehaviorText = $.Localize("iw_ui_ability_toggled");
	else if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_AUTOCAST)
		szBehaviorText = $.Localize("iw_ui_ability_autocast");
	else
		szBehaviorText = $.Localize("iw_ui_ability_target");
	
	//Not passive or toggled
	if (!(nAbilityBehavior & 0x0202))
	{
		szBehaviorText += " - ";
		if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_UNIT_TARGET)
		{
			var nTargetTeam = Abilities.GetAbilityTargetTeam(nAbilityIndex);
			switch (nTargetTeam)
			{
				case DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_FRIENDLY:
					szBehaviorText += $.Localize("iw_ui_ability_target_ally");
					break;
				case DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_ENEMY:
					szBehaviorText += $.Localize("iw_ui_ability_target_enemy");
					break;
				default:
					szBehaviorText += $.Localize("iw_ui_ability_target_unit");
					break;
			}
		}
		else if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_POINT)
		{
			szBehaviorText += $.Localize("iw_ui_ability_target_ground");
		}
		else if (nAbilityExtFlags & IW_ABILITY_FLAG_KEYWORD_WEATHER)
		{
			szBehaviorText += $.Localize("iw_ui_ability_target_weather");
		}
		else if (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_NO_TARGET)
		{
			szBehaviorText += $.Localize("iw_ui_ability_target_self");
		}
	}
	else
	{
		if (nAbilityExtFlags & IW_ABILITY_FLAG_KEYWORD_ATTACK)
		{
			szBehaviorText += " - ";
			szBehaviorText += $.Localize("iw_ui_ability_target_attack");
		}
	}
	hBehaviorLabel.FindChild("Title").text = szBehaviorText;
	
	var tEntitySpellbook = CustomNetTables.GetTableValue("spellbook", nEntityIndex);
	var tSpellData = tEntitySpellbook.Spells[nAbilityIndex];
	
	var nManaCost = Abilities.GetManaCost(nAbilityIndex);
	var hManaLabel = hContextPanel.FindChildTraverse("Stat1");
	hManaLabel.FindChild("Value").text = nManaCost.toFixed(0) + "";
	hManaLabel.visible = (nManaCost > 0);
	
	var fManaUpkeep = tSpellData ? tSpellData.mana_upkeep : (tAbilityData ? tAbilityData.mana_upkeep : 0);
	var hManaUpkeepLabel = hContextPanel.FindChildTraverse("Stat2");
	hManaUpkeepLabel.FindChild("Value").text = Math.floor(fManaUpkeep * 100)/100 + "/s";
	hManaUpkeepLabel.visible = (fManaUpkeep > 0);
	
	var hStaminaLabel = hContextPanel.FindChildTraverse("Stat3");
	hStaminaLabel.visible = false;
	
	var fStaminaUpkeep = tSpellData ? tSpellData.stamina_upkeep : (tAbilityData ? tAbilityData.stamina_upkeep : 0);
	var hStaminaUpkeepLabel = hContextPanel.FindChildTraverse("Stat4");
	hStaminaUpkeepLabel.FindChild("Value").text = Math.floor(fStaminaUpkeep * 100)/100 + "/s";
	hStaminaUpkeepLabel.visible = (fStaminaUpkeep > 0);
	
	var nCooldown = Abilities.GetCooldown(nAbilityIndex);
	var hCooldownLabel = hContextPanel.FindChildTraverse("Stat5");
	hCooldownLabel.FindChild("Value").text = Math.round(nCooldown * 100)/100 + "";
	hCooldownLabel.visible = (nCooldown > 0);
	
	var hRangeLabel = hContextPanel.FindChildTraverse("Stat6");
	var hCastTimeLabel = hContextPanel.FindChildTraverse("Stat7");
	
	//Non-toggled, non-passive abilities
	if ((nAbilityBehavior & 514) === 0)
	{
		hRangeLabel.visible = true;
		hCastTimeLabel.visible = true;
		var nCastRange = Abilities.GetCastRange(nAbilityIndex);
		if (nCastRange === 0)
			hRangeLabel.FindChild("Value").text = $.Localize("iw_ui_ability_stat_cast_range_self");
		else
			hRangeLabel.FindChild("Value").text = (nCastRange/100.0).toFixed(2) + "m";
		
		var nCastPoint = Abilities.GetCastRange(nAbilityIndex);
		hCastTimeLabel.FindChild("Value").text = (nCastPoint/1000.0).toFixed(2) + "s";
	}
	else
	{
		hRangeLabel.visible = false;
		hCastTimeLabel.visible = false;
	}
	
	var hChannelTimeLabel = hContextPanel.FindChildTraverse("Stat8");
	hChannelTimeLabel.visible = (nAbilityBehavior & DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_CHANNELLED);
	hChannelTimeLabel.FindChild("Value").text = Abilities.GetChannelTime(nAbilityIndex).toFixed(1) + "s";
	
	var hSkillContainer = hContextPanel.FindChildTraverse("SkillContainer");
	hSkillContainer.RemoveAndDeleteChildren();
	
	var nStaminaCost = tAbilityData.stamina;
	hStaminaLabel.FindChild("Value").text = nStaminaCost.toFixed(0) + "";
	hStaminaLabel.visible = (nStaminaCost > 0);
	
	var nSkillMask = tAbilityData.skill;
	for (var i = 3; i >= 0; i--)
	{
		var nLevel = (nSkillMask >>> (i * 8)) & 0x07;
		var nSkill = ((nSkillMask >>> (i * 8)) & 0xF8) >> 3;
		if (nSkill !== 0)
		{
			for (var j = 0; j < nLevel; j++)
			{
				var hSkillIcon = $.CreatePanel("Image", hSkillContainer, "SkillIcon" + i + "_" + j);
				hSkillIcon.SetImage("file://{images}/custom_game/icons/skills/iw_skill_icon_" + (nSkill - 1) + ".tga");
				hSkillIcon.AddClass("AbilityDetailsSkillIcon");
			}
		}
	}
	
	var hDescriptionLabel = hContextPanel.FindChildTraverse("DescriptionLabel");
	hDescriptionLabel.text = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName + "_Description");
	
	var szLocalizedText = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName + "_Description");
	var tSpecialSections = szLocalizedText.match(/[^{}]+(?=})/g);
	var tTextSections = szLocalizedText.replace(/\{[^}]+\}/g, "|").split("|");
	
	var szFormattedText = "";
	for (var i = 0; i < tTextSections.length; i++)
	{
		szFormattedText += tTextSections[i];
		if (tSpecialSections && tSpecialSections[i])
		{
			var tAbilitySpecials = tSpecialSections[i].split("|");
			var tAbilityBaseValues = tAbilitySpecials[0].split("*", 2);
			
			var fSpecialBaseValue = Abilities.GetSpecialValueFor(nAbilityIndex, tAbilityBaseValues[0]);
			var fSpecialBonusValue = 0;
			if (tAbilityBaseValues[0] === "r")
			{
				fSpecialBaseValue = (Abilities.GetAOERadius(nAbilityIndex)/100.0).toFixed(2);
			}
			else if (tAbilityBaseValues.length > 1)
			{
				var fSpecialBaseMultiplier = parseFloat(tAbilityBaseValues[1]);
				if (fSpecialBaseMultiplier)
				{
					fSpecialBaseValue *= fSpecialBaseMultiplier;
				}
			}
				
			if ((typeof(fSpecialBaseValue) === "number") && (tAbilitySpecials.length > 1))
			{
				var tAbilitySpecialValues = tAbilitySpecials[1].split("*", 2);
				var fSpecialBonus = Abilities.GetSpecialValueFor(nAbilityIndex, tAbilitySpecialValues[0]);
				if (typeof(fSpecialBonus) === "number")
				{
					fSpecialBonusValue = Math.round(fSpecialBonus * 100)/100;
				}
				if (tAbilitySpecialValues.length > 1)
				{
					var fSpecialBonusMultiplier = parseFloat(tAbilitySpecialValues[1]);
					if (fSpecialBonusMultiplier)
					{
						fSpecialBonusValue *= fSpecialBonusMultiplier;
					}
				}
			}
			
			if (fSpecialBonusValue > 0)
			{
				szFormattedText = szFormattedText + "(" + fSpecialBaseValue + " + " + fSpecialBonusValue + "x)";
			}
			else
			{
				szFormattedText += fSpecialBaseValue;
			}
		}
	}
	
	hDescriptionLabel.text = szFormattedText;
	
	var hLoreLabel = hContextPanel.FindChildTraverse("LoreLabel");
	hLoreLabel.text = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName + "_Lore");
	
	var hNotesContainer = hContextPanel.FindChildTraverse("NotesContainer");
	hNotesContainer.RemoveAndDeleteChildren();
	for (var i = 0;; i++)
	{
		var szNoteName = "DOTA_Tooltip_Ability_" + szAbilityName + "_Note" + i;
		var szLocalizedNoteText = $.Localize(szNoteName);
		if (szLocalizedNoteText !== szNoteName)
		{
			var hNoteLabel = $.CreatePanel("Label", hNotesContainer, "Note" + i);
			hNoteLabel.AddClass("AbilityDetailsNotesLabel");
			hNoteLabel.text = "• " + szLocalizedNoteText;
		}
		else
		{
			break;
		}
	}
	return true;
}

function OnAbilityDetailsUpdateCombo(hContextPanel, tArgs)
{
	var szAbilityName = tArgs.name;
	var hComboContainer = hContextPanel.FindChildTraverse("ComboContainer");
	DispatchCustomEvent(hContextPanel, "AbilityDetailsSetVisible", { visible:true });
	hContextPanel.FindChildTraverse("TitleLabel").text = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName);
	hContextPanel.FindChildTraverse("Icon").SetImage("file://{images}/spellicons/" + szAbilityName + ".png");
	hContextPanel.FindChildTraverse("StatsContainer").visible = false;
	hComboContainer.visible = true;
	
	var hSkillContainer = hContextPanel.FindChildTraverse("SkillContainer");
	hSkillContainer.RemoveAndDeleteChildren();
	hComboContainer.RemoveAndDeleteChildren();
	
	var tComboTemplate = tArgs.template;
	for (var i = 0; i < tComboTemplate.length; i++)
	{
		var tComboGroup = tComboTemplate[i];
		if (tComboGroup.length > 1)
		{
			var hLeftGroupBracket = $.CreatePanel("Label", hComboContainer, "Combo_" + i + "_Left");
			hLeftGroupBracket.AddClass("AbilityDetailsComboLabel");
			hLeftGroupBracket.text = "(";
			
			for (var j = 0; j < tComboGroup.length - 1; j++)
			{
				var hIcon = $.CreatePanel("Image", hComboContainer, "Combo_" + i + "_Icon_" + j);
				hIcon.SetPanelEvent("onmouseover", OnAbilityDetailsComboIconMouseOver.bind(this, hIcon));
				hIcon.SetPanelEvent("onmouseout", OnAbilityDetailsComboIconMouseOut.bind(this, hIcon));
				hIcon.SetImage("file://{images}/spellicons/" + tComboGroup[j] + ".png");
				hIcon.SetAttributeString("name", tComboGroup[j]);
				hIcon.AddClass("AbilityDetailsComboIcon");
				
				var hDivider = $.CreatePanel("Label", hComboContainer, "Combo_" + i + "_Divider_" + j);
				hDivider.AddClass("AbilityDetailsComboLabel");
				hDivider.text = "/";
			}
			
			var hIcon = $.CreatePanel("Image", hComboContainer, "Combo_" + i + "_Icon_" + tComboGroup.length - 1);
			hIcon.SetPanelEvent("onmouseover", OnAbilityDetailsComboIconMouseOver.bind(this, hIcon));
			hIcon.SetPanelEvent("onmouseout", OnAbilityDetailsComboIconMouseOut.bind(this, hIcon));
			hIcon.SetImage("file://{images}/spellicons/" + tComboGroup[tComboGroup.length - 1] + ".png");
			hIcon.SetAttributeString("name", tComboGroup[tComboGroup.length - 1]);
			hIcon.AddClass("AbilityDetailsComboIcon");
			
			var hRightGroupBracket = $.CreatePanel("Label", hComboContainer, "Combo_" + i + "_Right");
			hRightGroupBracket.AddClass("AbilityDetailsComboLabel");
			hRightGroupBracket.text = ")";
		}
		else
		{
			var hIcon = $.CreatePanel("Image", hComboContainer, "Combo_" + i + "_Icon_0");
			hIcon.SetPanelEvent("onmouseover", OnAbilityDetailsComboIconMouseOver.bind(this, hIcon));
			hIcon.SetPanelEvent("onmouseout", OnAbilityDetailsComboIconMouseOut.bind(this, hIcon));
			hIcon.SetImage("file://{images}/spellicons/" + tComboGroup[0] + ".png");
			hIcon.SetAttributeString("name", tComboGroup[0]);
			hIcon.AddClass("AbilityDetailsComboIcon");
		}
		if (i !== tComboTemplate.length - 1)
		{
			var hPlusLabel = $.CreatePanel("Label", hComboContainer, "Combo_" + i + "_Plus");
			hPlusLabel.AddClass("AbilityDetailsComboLabel");
			hPlusLabel.text = "+";
		}
	}
	
	var hDescriptionLabel = hContextPanel.FindChildTraverse("DescriptionLabel");
	hDescriptionLabel.text = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName + "_Description");
	var hLoreLabel = hContextPanel.FindChildTraverse("LoreLabel");
	hLoreLabel.text = $.Localize("DOTA_Tooltip_Ability_" + szAbilityName + "_Lore");
	
	var hNotesContainer = hContextPanel.FindChildTraverse("NotesContainer");
	hNotesContainer.RemoveAndDeleteChildren();
	for (var i = 0;; i++)
	{
		var szNoteName = "DOTA_Tooltip_Ability_" + szAbilityName + "_Note" + i;
		var szLocalizedNoteText = $.Localize(szNoteName);
		if (szLocalizedNoteText !== szNoteName)
		{
			var hNoteLabel = $.CreatePanel("Label", hNotesContainer, "Note" + i);
			hNoteLabel.AddClass("AbilityDetailsNotesLabel");
			hNoteLabel.text = "• " + szLocalizedNoteText;
		}
		else
		{
			break;
		}
	}
	
	return true;
}

function OnAbilityDetailsEntityUpdate(szTableName, szKey, tData)
{
	var nEntityIndex = $.GetContextPanel().GetAttributeInt("entindex", -1);
	if (parseInt(szKey) === nEntityIndex)
	{
		DispatchCustomEvent($.GetContextPanel(), "AbilityDetailsUpdate");
	}
}

function CreateAbilityDetails(hParent, szName)
{
	var hPanel = $.CreatePanel("Panel", hParent, szName);
	hPanel.BLoadLayout("file://{resources}/layout/custom_game/ability/iw_ability_details.xml", false, false);
	
	var hStatsContainer = hPanel.FindChildTraverse("StatsContainer");
	for (var i = 0; i < stAbilityDetailsStatNames.length; i++)
	{
		var hStatPanel = $.CreatePanel("Panel", hStatsContainer, "Stat" + i);
		hStatPanel.BLoadLayoutSnippet("AbilityDetailsStatSnippet");
		hStatPanel.FindChild("Title").text = $.Localize(stAbilityDetailsStatNames[i]);
	}
	
	RegisterCustomEventHandler(hPanel, "AbilityDetailsPartyUpdate", OnAbilityDetailsPartyUpdate);
	RegisterCustomEventHandler(hPanel, "AbilityDetailsSetVisible", OnAbilityDetailsSetVisible);
	RegisterCustomEventHandler(hPanel, "AbilityDetailsUpdate", OnAbilityDetailsUpdate);
	RegisterCustomEventHandler(hPanel, "AbilityDetailsUpdateCombo", OnAbilityDetailsUpdateCombo);
	
	DispatchCustomEvent(hPanel, "AbilityDetailsShowAbility", { abilityindex:-1 });
	CustomNetTables.SubscribeNetTableListener("entities", OnAbilityDetailsEntityUpdate);
			
	return hPanel;
}