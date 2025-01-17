require("mechanics/effect_shatter")
require("world_object")

--States
--  0 = Placed, but not armed. Trapjaw takes 3.0s to arm
--  1 = Armed. Will trigger on any nearby non-flying enemy
--  2 = Used. The Trapjaw has triggered on an enemy and cannot trigger again

npc_iw_bounty_hunter_trapjaw = class({})

function npc_iw_bounty_hunter_trapjaw:OnTrapjawTrigger(hTarget)
	local hModifier = self:FindModifierByName("modifier_iw_bounty_hunter_trapjaw_buff")
	local hAbility = hModifier:GetAbility()
	local hCaster = hModifier:GetCaster()
	if hTarget and hAbility and hCaster then
		self._hTrapTarget = hTarget
		self:SetObjectState(2)
		local tDamageTable =
		{
			attacker = hCaster,
			target = hTarget,
			source = hAbility,
			damage =
			{
				[IW_DAMAGE_TYPE_PIERCE] = 
				{
					min = hAbility:GetSpecialValueFor("damage_min") + hAbility:GetSpecialValueFor("damage_bonus") * hCaster:GetSpellpower(),
					max = hAbility:GetSpecialValueFor("damage_max") + hAbility:GetSpecialValueFor("damage_bonus") * hCaster:GetSpellpower(),
				}
			}
		}
		DealPrimaryDamage(hAbility, tDamageTable)
		TriggerShatter(hTarget)
		
		self:AddChild(hCaster)	--This is to make sure that the root debuff uses the caster's stats (such as outgoing debuff duration)
		hTarget:RemoveModifierByName("modifier_iw_bounty_hunter_trapjaw_root")
		local hRootModifier = hTarget:AddNewModifier(self, hAbility, "modifier_iw_bounty_hunter_trapjaw_root", { root_duration = hAbility:GetSpecialValueFor("root_duration") })
		if hRootModifier then
			self:SetAbsOrigin(hTarget:GetAbsOrigin())
		end
		EmitSoundOn("Hero_BountyHunter.Trapjaw", self)
	end
end

function npc_iw_bounty_hunter_trapjaw:OnTrapjawThink()
	if not self._fTriggerRadius then
		local hModifier = self:FindModifierByName("modifier_iw_bounty_hunter_trapjaw_buff")
		if hModifier then
			local hAbility = hModifier:GetAbility()
			if hAbility then
				self._fTriggerRadius = hAbility:GetAOERadius()
				self._hParentEntity = hModifier:GetCaster()
			end
		end
	end
	local nObjectState = self:GetObjectState()
	if nObjectState < 2 then
		if nObjectState == 0 and GameRules:GetGameTime() - self._fCreateTime > 3.0 then
			self:SetObjectState(1)
		end
		local fTriggerRadius = self._fTriggerRadius
		local hParentEntity = self._hParentEntity
		if fTriggerRadius and hParentEntity and nObjectState == 1 then
			local tUnitsList = FindUnitsInRadius(hParentEntity:GetTeamNumber(), self:GetAbsOrigin(), nil, fTriggerRadius, DOTA_UNIT_TARGET_TEAM_ENEMY, DOTA_UNIT_TARGET_ALL, 0, 0, false)
			for k,v in pairs(tUnitsList) do
				if IsValidExtendedEntity(v) and not v:IsFlying() and not v:IsConsideredDead() then
					self:OnTrapjawTrigger(v)
					return
				end
			end
		end
		return 0.1
	end
end

function npc_iw_bounty_hunter_trapjaw:OnChangeState(fNewState)
	if fNewState == 2 then
		self:ForceKill(false)
		self:SetThink(function() self:RespawnUnit() end, "TrapjawRespawn", 1.0)
	end
end

function npc_iw_bounty_hunter_trapjaw:OnInteract(hEntity)
	local hStackModifier = hEntity:FindModifierByName("modifier_iw_bounty_hunter_trapjaw_stack")
	if hStackModifier then
		local hTarget = self._hTrapTarget
		if hTarget then
			local hRootModifier = hTarget:FindModifierByName("modifier_iw_bounty_hunter_trapjaw_root")
			if hRootModifier and hRootModifier:GetCaster() == self then
				hRootModifier:Destroy()
			end
		end
		hStackModifier:SetStackCount(hStackModifier:GetStackCount() + 1)
		EmitSoundOn("Hero_BountyHunter.Trapjaw.PickUp", hEntity)
		self:RemoveSelf()
	end
	return true
end

function npc_iw_bounty_hunter_trapjaw:OnInteractFilterInclude(hEntity)
	return hEntity:GetUnitName() == "npc_dota_hero_bounty_hunter"
end

function Spawn(args)
	--[[if not IsValidWorldObject(thisEntity) then
		local hParent = thisEntity:GetOwner()
		local hAbility = hParent:FindAbilityByName("iw_bounty_hunter_trapjaw")
		thisEntity:AddNewModifier(hParent, hAbility, "modifier_iw_bounty_hunter_trapjaw_buff", {})
		
		setmetatable(thisEntity, ExtendIndexTable(thisEntity, npc_iw_bounty_hunter_trapjaw))
		thisEntity._fCreateTime = GameRules:GetGameTime()
		thisEntity:SetThink("OnTrapjawThink", thisEntity, "TrapjawThink", 0.1)
		
		local fRandomAngle = RandomFloat(0, 6.28318530718)
		thisEntity:SetForwardVector(Vector(math.cos(fRandomAngle), math.sin(fRandomAngle), 0))
	end]]
end
