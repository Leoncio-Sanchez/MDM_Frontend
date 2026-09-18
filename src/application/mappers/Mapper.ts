export interface Mapper<DomainEntity, DTO> {
  toDomain(raw: DTO): DomainEntity;
  toDTO(entity: DomainEntity): DTO;
}
