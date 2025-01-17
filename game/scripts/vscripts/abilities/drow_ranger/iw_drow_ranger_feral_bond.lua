iw_drow_ranger_feral_bond = class({})

function iw_drow_ranger_feral_bond:CastFilterResultTarget(hTarget)
	if IsServer() then
		self._bSubtypeFailed = false
		self._bClassFailed = false
		if not bit32.btest(hTarget:GetUnitSubtype(), IW_UNIT_SUBTYPE_BEAST) then
			self._bTargetFailed = true
			return UF_FAIL_CUSTOM
		elseif hTarget:GetUnitClass() > IW_UNIT_CLASS_VETERAN then
			self._bClassFailed = true
			return UF_FAIL_CUSTOM
		end
	end
	return UF_SUCCESS
end

function iw_drow_ranger_feral_bond:GetCustomCastErrorTarget(hTarget)
	if self._bTargetFailed then return "#iw_error_cast_beast" end
	if self._bClassFailed then return "#iw_error_cast_veteran_or_lower" end
end

function iw_drow_ranger_feral_bond:OnSpellStart()
	if IsServer() then
		local hEntity = self:GetCaster()
		local hTarget = self:GetCursorTarget()
		
		local tModifierArgs =
		{
			attrib_percent = self:GetSpecialValueFor("attrib_percent"),
			attack_speed = self:GetSpecialValueFor("attack_speed"),
		}
		
		hTarget:SetTeam(DOTA_TEAM_GOODGUYS)
		hTarget:SetControllableByPlayer(0, true)
		hTarget:Stop()
		
		local hParentModifier = hEntity:AddNewModifier(hEntity, self, "modifier_iw_drow_ranger_feral_bond", tModifierArgs)
		local hChildModifier = hTarget:AddNewModifier(hEntity, self, "modifier_iw_drow_ranger_feral_bond", tModifierArgs)
		hParentModifier:RefreshModifier()
		
		local nParticleID = ParticleManager:CreateParticle("particles/units/heroes/hero_drow/drow_feral_bond_cast.vpcf", PATTACH_ABSORIGIN_FOLLOW, hTarget)
		ParticleManager:SetParticleControl(nParticleID, 2, hTarget:GetAbsOrigin())
		ParticleManager:SetParticleControlForward(nParticleID, 2, hTarget:GetForwardVector())
		ParticleManager:ReleaseParticleIndex(nParticleID)
		
		EmitSoundOn("Hero_DrowRanger.FeralBond", hTarget)
		
		self:SetActivated(false)
	end
end