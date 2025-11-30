

export class Ingredient {
  public title: string = ""
  public link: string = ""
}

export type Step = string

export class Creation {
  public id: string = ""
  public heroImg: string = ""
  public title: string = ""
  public desc: string = ""
  public bom: Ingredient[] = []
  public steps: Step[] = []
  public notes: string = ""
}