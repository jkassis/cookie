

export class Ingredient {
  public title: string = ""
  public link: string = ""
}

export type Step = string

export class Creation {
  public bom: Ingredient[] = []
  public desc: string = ""
  public heroImg: string = ""
  public id: string = ""
  public notes: string = ""
  public steps: Step[] = []
  public tags: string[] = []
  public time: string = ""
  public title: string = ""
}